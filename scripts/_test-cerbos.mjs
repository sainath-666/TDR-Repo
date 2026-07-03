import { loadEnvConfig } from '@next/env';
import { withCerbos } from '../src/lib/cerbos/enforce.ts';

loadEnvConfig(process.cwd());
console.log('NODE_ENV', process.env.NODE_ENV);
console.log('CERBOS_MOCK_MODE', process.env.CERBOS_MOCK_MODE);

try {
  const id = await withCerbos(
    { id: '1', role: 'DEO', districtCode: 'GNT' },
    { kind: 'bond', id: 'new' },
    'create',
  );
  console.log('OK', id);
} catch (e) {
  console.log('ERR', e.message);
}
