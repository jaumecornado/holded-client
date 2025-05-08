import debugLib from 'debug';

const debug = debugLib('holded:client:documents');

interface DocumentsApiOptions {
  httpClient: any;
}

interface ListParams {
  type: string;
}

interface CreateParams {
  type: string;
  document: any;
}

interface GetParams {
  type: string;
  id: string|number;
}

interface DeleteParams {
  type: string;
  id: string | number;
}

interface UpdateParams {
  type: string;
  id: string | number;
  document: any;
}

interface DownloadPdfParams {
  type: string;
  id: string | number;
}

interface PayParams {
  type: string;
  id: string | number;
  payment?: any;
}

export type DocumentType =
  | 'creditnote'
  | 'estimate'
  | 'invoice'
  | 'proform'
  | 'purchase'
  | 'purchaserefund'
  | 'salesorder'
  | 'salesreceipt';

export default class DocumentsApi {
  private _resourceName: string;
  private _httpClient: any;

  constructor({ httpClient }: DocumentsApiOptions) {
    this._resourceName = 'documents';
    this._httpClient = httpClient;

    this._decorateInvalidTypeMethods(['list', 'create', 'get', 'delete', 'update', 'downloadPdf', 'pay']);

    debug('Holded "documents" API created', this.types);
  }

  get resourceName(): string {
    return this._resourceName;
  }

  get types(): Record<string, DocumentType> {
    return {
      CREDITNOTE: 'creditnote',
      ESTIMATE: 'estimate',
      INVOICE: 'invoice',
      PROFORM: 'proform',
      PURCHASE: 'purchase',
      PURCHASEREFUND: 'purchaserefund',
      SALESORDER: 'salesorder',
      SALESRECEIPT: 'salesreceipt',
    };
  }

  set types(_value: any) {
    throw new Error('Modifying document types is not permitted!');
  }

  async list({ type }: ListParams): Promise<any> {
    debug('Fetching "%s" documents...', type);

    const { data: documents } = await this._httpClient.request({
      method: 'get',
      url: `/documents/${type}`,
    });

    debug(documents);
    return documents;
  }

  async create({ type, document }: CreateParams): Promise<any> {
    debug('Creating new "%s" document...', type);

    const { data } = await this._httpClient.request({
      method: 'post',
      url: `/documents/${type}`,
      data: document,
    });

    debug(data);
    return data;
  }

  async get({ type, id }: GetParams): Promise<any> {
    debug('Getting "%s" document id="%s"...', type, id);

    const { data } = await this._httpClient.request({
      method: 'get',
      url: `/documents/${type}/${id}`,
    });

    debug(data);
    return data;
  }

  async delete({ type, id }: DeleteParams): Promise<any> {
    debug('Deleting "%s" document id="%s"...', type, id);

    const { data } = await this._httpClient.request({
      method: 'delete',
      url: `/documents/${type}/${id}`,
    });

    debug(data);
    return data;
  }

  async update({ type, id, document }: UpdateParams): Promise<any> {
    debug('Updating "%s" document id="%s"...', type, id);

    const { data } = await this._httpClient.request({
      method: 'put',
      url: `/documents/${type}/${id}`,
      data: document,
    });

    debug(data);
    return data;
  }

  async downloadPdf({ type, id }: DownloadPdfParams): Promise<any> {
    debug('Downloading "%s" document id="%s" to PDF...', type, id);

    const { data: base64Pdf } = await this._httpClient.request({
      method: 'get',
      url: `/documents/${type}/${id}/pdf`,
    });

    return base64Pdf;
  }

  async pay({ type, id, payment }: PayParams): Promise<any> {
    debug('Paying "%s" document id="%s"...', type, id);

    const { data } = await this._httpClient.request({
      method: 'post',
      url: `/documents/${type}/${id}/pay`,
      data: payment,
    });

    debug(data);
    return data;
  }

  private _throwIfInvalidType(type: DocumentType): void {
    const allowedTypes = Object.values(this.types);

    if (!allowedTypes.includes(type)) {
      throw new Error(
        `Unknown document type "${type}"! Please provide one of the following type: ${allowedTypes.join(', ')}.`
      );
    }
  }

  private _decorateInvalidTypeMethods(methodNames: string[]): void {
    methodNames.forEach((methodName) => {
      const originalMethod = (this as any)[methodName].bind(this);

      (this as any)[methodName] = async (params: any) => {
        const { type } = params;
        this._throwIfInvalidType(type);
        return originalMethod(params);
      };
    });
  }
}
