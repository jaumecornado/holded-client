import fs from 'fs';
import dotEnv from 'dotenv';
import debugLib from 'debug';
import HoldedClient from '../../index';
import type { DocumentType } from '../DocumentsApi'; // Asegúrate de exportar DocumentType en ese archivo

const debug = debugLib('holded:client:demo');

const env = dotEnv.config({ path: '.env-dev' });
const { HOLDED_API_KEY: apiKey } = env.parsed as { HOLDED_API_KEY: string };

const client = new HoldedClient({ apiKey });
const { types: docTypes } = client.documents;

type ResourceName =
  | 'contacts'
  | 'saleschannels'
  | 'products'
  | 'warehouses'
  | 'treasury'
  | 'expensesaccounts'
  | 'payments';

function listDocuments({ type }: { type: DocumentType }) {
  return client.documents.list({ type });
}

function getDocument({ type, id }: { type: DocumentType; id: string }) {
  return client.documents.get({ type, id });
}

function createDocument({ type, document }: { type: DocumentType; document: any }) {
  return client.documents.create({ type, document });
}

function updateDocument({ type, id, document }: { type: DocumentType; id: string; document: any }) {
  return client.documents.update({ type, id, document });
}

function payDocument({ type, id, payment }: { type: DocumentType; id: string; payment: any }) {
  return client.documents.pay({ type, id, payment });
}

async function downloadDocument({ type, id, file }: { type: DocumentType; id: string; file: string }) {
  const { data: base64Pdf } = await client.documents.downloadPdf({ type, id });
  const pdfFile = `./es/demo/out/${type}-${file}`;

  try {
    fs.unlinkSync(pdfFile);
  } catch (e) {
    // nothing to do
  }

  fs.writeFileSync(pdfFile, base64Pdf, { encoding: 'base64' });
  debug('PDF invoice file saved to "%s".', pdfFile);
  return pdfFile;
}

function deleteDocument({ type, id }: { type: DocumentType; id: string }) {
  return client.documents.delete({ type, id });
}

function listResources({ resourceName }: { resourceName: ResourceName }) {
  return client[resourceName].list();
}

function createResource({ resourceName, resource }: { resourceName: ResourceName; resource: any }) {
  return client[resourceName].create({ resource });
}

function getResource({ resourceName, id }: { resourceName: ResourceName; id: string }) {
  return client[resourceName].get({ id });
}

function updateResource({ resourceName, id, resource }: { resourceName: ResourceName; id: string; resource: any }) {
  return client[resourceName].update({ id, resource });
}

function deleteResource({ resourceName, id }: { resourceName: ResourceName; id: string }) {
  return client[resourceName].delete({ id });
}

(async () => {
  const resources = [
    { name: 'contacts', data: { name: 'Mariano R.', code: '78' } },
    { name: 'saleschannels', data: { name: 'Main store', desc: 'Barcelona store in Pg de G' } },
    { name: 'products', data: { name: 'Radiometer' } },
    { name: 'warehouses', data: { name: 'Main warehouse' } },
    { name: 'treasury', data: {} },
    { name: 'expensesaccounts', data: { name: 'Main account', desc: '*****' } },
    { name: 'payments', data: { amount: 99, desc: 'For good services' } },
  ] as { name: ResourceName; data: any }[];

  for (const { name: resourceName, data: resource } of resources) {
    try {
      const { id } = await createResource({ resourceName, resource });
      await listResources({ resourceName });
      await getResource({ resourceName, id });

      const shouldUpdate = Boolean(resource.name);
      if (shouldUpdate) {
        const updatedResource = { ...resource, id, name: `${resource.name} -> updated` };
        await updateResource({ resourceName, id, resource: updatedResource });
        await getResource({ resourceName, id });
      } else {
        debug('Skipping update.');
      }

      await getResource({ resourceName, id });
      await deleteResource({ resourceName, id });
      await listResources({ resourceName });
    } catch (demoError: any) {
      debug(demoError);
      if (demoError.response) {
        debug(demoError.response.data);
      }
    }
  }

  try {
    const type: DocumentType = docTypes.SALESRECEIPT;
    const items = [{
      name: '6h chillax coworking Gerona',
      desc: 'Meeting room reservation',
      units: 1,
      subtotal: 300,
      tax: 20, // %
      sku: 'co-gerona-bcn',
    }];
    const document = {
      salesChannelId: '5ae61a9b2e1d933c6806be13',
      contactCode: 42,
      contactName: 'Antoine',
      date: Date.now() / 1000, // PHP on the backend baby
      notes: 'Services provided to Antoine',
      language: 'en',
      items,
    };
    const payment = {
      date: Date.now() / 1000,
      amount: 360,
    };

    const { id } = await createDocument({ type, document });
    await listDocuments({ type });
    await getDocument({ type, id });
    await downloadDocument({ type, id, file: 'antoine.pdf' });

    await updateDocument({ type, id, document: { language: 'fr', notes: 'Updated services', items } });
    await downloadDocument({ type, id, file: 'antoine-updated.pdf' });

    await payDocument({ type, id, payment });

    await deleteDocument({ type, id });
    await listDocuments({ type });
  } catch (demoError: any) {
    debug(demoError);
    if (demoError.response) {
      debug(demoError.response.data);
    }
  }
})();