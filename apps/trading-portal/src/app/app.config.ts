import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  ScannerApiSnapshotService,
  ScannerRecoverySource,
} from './scanner/scanner-api-snapshot.service';
import { ScannerSignalRTransport, ScannerTransport } from './scanner/scanner-signalr.transport';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes),
    { provide: ScannerRecoverySource, useExisting: ScannerApiSnapshotService },
    { provide: ScannerTransport, useExisting: ScannerSignalRTransport },
  ],
};
