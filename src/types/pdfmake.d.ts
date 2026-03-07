declare module "pdfmake/build/pdfmake" {
  interface TCreatedPdf {
    download(filename?: string): void;
    open(): void;
    print(): void;
    getBlob(callback: (blob: Blob) => void): void;
    getBase64(callback: (base64: string) => void): void;
  }

  interface PdfMakeStatic {
    vfs: Record<string, string>;
    createPdf(docDefinition: any): TCreatedPdf;
  }

  const pdfMake: PdfMakeStatic;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfsFonts: any;
  export default vfsFonts;
}
