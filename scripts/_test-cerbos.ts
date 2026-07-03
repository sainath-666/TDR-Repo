import { loadEnvConfig } from '@next/env';
import { withCerbos } from '../src/lib/cerbos/enforce';

loadEnvConfig(process.cwd());
console.log('NODE_ENV', process.env.NODE_ENV);
console.log('CERBOS_MOCK_MODE', process.env.CERBOS_MOCK_MODE);

withCerbos({ id: '1', role: 'DEO', districtCode: 'GNT' }, { kind: 'bond', id: 'new' }, 'create')
  .then((id) => console.log('OK', id))
  .catch((e: Error) => console.log('ERR', e.message));
