import debugLib from 'debug';

const debug = debugLib('holded:client:api');

interface GenericApiOptions {
  resourceName: string;
  httpClient: any;
}

/**
 * The Holded invoice API
 * @see https://developers.holded.com/v1.0/reference
 */
export default class GenericApi {
  private _resourceName: string;
  private _httpClient: any;

  constructor({ resourceName, httpClient }: GenericApiOptions) {
    this._resourceName = resourceName;
    this._httpClient = httpClient;
    debug('Holded "%s" API created', this._resourceName);
  }

  get resourceName(): string {
    return this._resourceName;
  }

  async list(): Promise<any> {
    debug('Fetching "%s" resources...', this._resourceName);

    const { data: resources } = await this._httpClient.request({
      method: 'get',
      url: `/${this._resourceName}`,
    });

    debug(resources);
    return resources;
  }

  async create({ resource }: { resource: any }): Promise<any> {
    debug('Creating new "%s" resource...', this._resourceName);

    const { data } = await this._httpClient.request({
      method: 'post',
      url: `/${this._resourceName}`,
      data: resource,
    });

    debug(data);
    return data;
  }

  async get({ id }: { id: string }): Promise<any> {
    debug('Fetching "%s" resource id="%s"...', this._resourceName, id);

    const { data: resource } = await this._httpClient.request({
      method: 'get',
      url: `/${this._resourceName}/${id}`,
    });

    debug(resource);
    return resource;
  }

  async delete({ id }: { id: string }): Promise<any> {
    debug('Deleting "%s" resource id="%s"...', this._resourceName, id);

    const { data } = await this._httpClient.request({
      method: 'delete',
      url: `/${this._resourceName}/${id}`,
    });

    debug(data);
    return data;
  }

  async update({ id, resource }: { id: string; resource: any }): Promise<any> {
    debug('Updating "%s" resource id="%s"...', this._resourceName, id);

    const { data } = await this._httpClient.request({
      method: 'put',
      url: `/${this._resourceName}/${id}`,
      data: resource,
    });

    debug(data);
    return data;
  }
}
