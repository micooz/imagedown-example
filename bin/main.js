#!/usr/bin/env node

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

require('../dist/main.js');
