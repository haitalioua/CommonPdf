import { Concat as concat } from './src/concat';
import { FillForm as fillForm } from './src/fillform';
import { FDFGenerator as generator } from './src/fdf-generator';
import { DigitalSignature as ds, DigitalSignatureOption as dsOpts } from './src/digital-signature';
import { setup as binaryPath } from './src/setup';
import { Fix as fix } from './src/fix';
import { Rotate as rotate } from './src/rotate';
export declare const Concat: typeof concat, FillForm: typeof fillForm, FDFGenerator: typeof generator, PdfData: typeof generator._extractFieldNames, DigitalSignature: typeof ds, setup: typeof binaryPath, Fix: typeof fix, DigitalSignatureOption: typeof dsOpts, Rotate: typeof rotate;
export declare type FilePath = string;
