import { mergeTests } from '@playwright/test';
import { test as bdd } from 'playwright-bdd';
import { test as tatu } from '../e2e/fixtures';

// Junta o test do playwright-bdd com as fixtures do projeto (novoCliente, pix...)
export const test = mergeTests(bdd, tatu);
