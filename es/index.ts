import debugLib from 'debug';
import { version as pkgVersion } from '../package.json';
import HttpClient from './HttpClient';
import { DocumentsApi, GenericApi } from './api';

const debug = debugLib('holded:client:core');

interface HoldedClientOptions {
  apiKey: string;
}

/**
 * The client for the Holded invoice API v1.0
 * @see https://developers.holded.com/v1.0
 */
export default class HoldedClient {
  private _httpClient: any;
  public documents: DocumentsApi;
  public contacts!: GenericApi;
  public saleschannels!: GenericApi;
  public products!: GenericApi;
  public warehouses!: GenericApi;
  public treasury!: GenericApi;
  public expensesaccounts!: GenericApi;
  public payments!: GenericApi;

  constructor({ apiKey }: HoldedClientOptions) {
    debug('💎  Holded API client v%s', pkgVersion);

    const invoiceApiUrl = 'https://api.holded.com/api/invoicing/v1';

    this._httpClient = new HttpClient({
      baseURL: invoiceApiUrl,
      headers: {
        key: apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    [
      'contacts',
      'saleschannels',
      'products',
      'warehouses',
      'treasury',
      'expensesaccounts',
      'payments',
    ].forEach((resourceName) => {
      const api = new GenericApi({
        resourceName,
        httpClient: this._httpClient,
      });

      this._decorateNotFoundMethods({ api, methodNames: ['get', 'delete', 'update'] });

      (this as any)[resourceName] = api;
    });

    const api = new DocumentsApi({ httpClient: this._httpClient });
    this._decorateNotFoundMethods({ api, methodNames: ['downloadPdf', 'delete', 'update', 'get', 'pay'] });
    this.documents = api;

    debug('Holded API client created');
  }

  private _decorateNotFoundMethods({ api, methodNames }: { api: any; methodNames: string[] }) {
    methodNames.forEach((methodName) => {
      const originalMethod = api[methodName].bind(api);

      api[methodName] = async (params: any) => {
        try {
          return await originalMethod(params);
        } catch (error: any) {
          this._throwIfNotFoundError({
            error,
            resourceId: params.id,
            resourceName: api.resourceName,
          });

          throw error;
        }
      };
    });
  }

  private _throwIfNotFoundError({ error, resourceId, resourceName }: { error: any; resourceId: string; resourceName: string }) {
    const { response = {} } = error;
    const { status, data = {} } = response;
    const isNotFound = status === 400 &&
                        data.status === 0 &&
                        Boolean(data.info && data.info.match(/.*not found/i));

    if (isNotFound) {
      const notFoundError = new Error(`"${resourceName}" resource id="${resourceId}" not found!`);
      (notFoundError as any).response = {
        status: 404,
        statusText: 'Not Found',
      };
      (notFoundError as any).originalError = error;
      throw notFoundError;
    }
  }
}
