declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[]
    Sheets: Record<string, WorkSheet>
  }
  export interface WorkSheet {
    [key: string]: any
  }
  export function read(data: any, opts?: { type?: string }): WorkBook
  export const utils: {
    sheet_to_json(sheet: WorkSheet, opts?: { defval?: any; header?: any }): any[]
  }
}