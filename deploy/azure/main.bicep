targetScope = 'resourceGroup'

@description('Approved deployment environment. Live is intentionally unsupported.')
@allowed(['dev', 'test', 'staging'])
param environmentName string

@description('Approved Azure region after privacy, service and cost review.')
param location string

@description('Globally unique lowercase resource prefix.')
@minLength(3)
@maxLength(18)
param namePrefix string

@description('Immutable API container image reference including sha256 digest.')
param apiImage string

@description('Immutable Worker container image reference including sha256 digest.')
param workerImage string

@secure()
@description('Deployment-only PostgreSQL administrator password supplied from the approved secret store.')
param postgresAdministratorPassword string

@description('Existing delegated subnet for the Container Apps environment.')
param infrastructureSubnetId string

@description('Existing delegated subnet for PostgreSQL Flexible Server.')
param databaseSubnetId string

@description('Existing private DNS zone resource ID for PostgreSQL.')
param postgresPrivateDnsZoneId string

param tags object = {}

var commonTags = union(tags, {
  application: 'makh-trading'
  environment: environmentName
  'data-classification': 'synthetic-only'
  'live-authorized': 'false'
})
var suffix = uniqueString(resourceGroup().id, environmentName)

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-${environmentName}-logs-${suffix}'
  location: location
  tags: commonTags
  properties: {
    retentionInDays: environmentName == 'staging' ? 30 : 14
    features: { enableLogAccessUsingOnlyResourcePermissions: true }
  }
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${namePrefix}-${environmentName}-workload-${suffix}'
  location: location
  tags: commonTags
}

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: take('${namePrefix}-${environmentName}-kv-${suffix}', 24)
  location: location
  tags: commonTags
  properties: {
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enablePurgeProtection: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    publicNetworkAccess: 'Disabled'
    sku: { family: 'A', name: 'standard' }
  }
}

resource appEnvironment 'Microsoft.App/managedEnvironments@2025-07-01' = {
  name: '${namePrefix}-${environmentName}-cae-${suffix}'
  location: location
  tags: commonTags
  properties: {
    vnetConfiguration: {
      infrastructureSubnetId: infrastructureSubnetId
      internal: true
    }
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: '${namePrefix}-${environmentName}-pg-${suffix}'
  location: location
  tags: commonTags
  sku: { name: 'Standard_D2ds_v5', tier: 'GeneralPurpose' }
  properties: {
    version: '18'
    administratorLogin: 'makh_deployer'
    administratorLoginPassword: postgresAdministratorPassword
    network: {
      delegatedSubnetResourceId: databaseSubnetId
      privateDnsZoneArmResourceId: postgresPrivateDnsZoneId
      publicNetworkAccess: 'Disabled'
    }
    backup: {
      backupRetentionDays: environmentName == 'staging' ? 35 : 14
      geoRedundantBackup: 'Disabled'
    }
    storage: { storageSizeGB: 128, autoGrow: 'Enabled' }
    highAvailability: { mode: environmentName == 'staging' ? 'ZoneRedundant' : 'Disabled' }
  }
}

resource api 'Microsoft.App/containerApps@2025-07-01' = {
  name: '${namePrefix}-${environmentName}-api-${suffix}'
  location: location
  tags: commonTags
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${identity.id}': {} } }
  properties: {
    managedEnvironmentId: appEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: { external: false, targetPort: 8080, transport: 'http', allowInsecure: false }
    }
    template: {
      containers: [{
        name: 'api'
        image: apiImage
        env: [
          { name: 'Platform__Environment', value: environmentName }
          { name: 'Platform__AccountMode', value: environmentName == 'staging' ? 'paper' : 'synthetic' }
          { name: 'Platform__EntryLocked', value: 'true' }
        ]
        probes: [
          { type: 'Liveness', httpGet: { path: '/health', port: 8080 }, initialDelaySeconds: 10, periodSeconds: 30 }
          { type: 'Readiness', httpGet: { path: '/health', port: 8080 }, initialDelaySeconds: 5, periodSeconds: 10 }
        ]
        resources: { cpu: 0.5, memory: '1Gi' }
      }]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
}

resource worker 'Microsoft.App/containerApps@2025-07-01' = {
  name: '${namePrefix}-${environmentName}-worker-${suffix}'
  location: location
  tags: commonTags
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${identity.id}': {} } }
  properties: {
    managedEnvironmentId: appEnvironment.id
    configuration: { activeRevisionsMode: 'Single' }
    template: {
      containers: [{
        name: 'worker'
        image: workerImage
        env: [
          { name: 'Platform__Environment', value: environmentName }
          { name: 'Platform__AccountMode', value: environmentName == 'staging' ? 'paper' : 'synthetic' }
          { name: 'Platform__EntryLocked', value: 'true' }
        ]
        resources: { cpu: 0.5, memory: '1Gi' }
      }]
      scale: { minReplicas: 1, maxReplicas: 2 }
    }
  }
}

output resourceNames object = {
  containerEnvironment: appEnvironment.name
  api: api.name
  worker: worker.name
  database: database.name
  keyVault: vault.name
  logAnalytics: logs.name
}
