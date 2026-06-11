declare module 'pdfkit' {
  type PDFDocumentOptions = {
    size?: string | number[]
    margins?: { top: number; bottom: number; left: number; right: number }
    info?: Record<string, string>
  }

  type PDFTextOptions = {
    width?: number
    align?: 'left' | 'center' | 'right' | 'justify'
    continued?: boolean
    lineBreak?: boolean
  }

  type PDFImageOptions = {
    width?: number
    height?: number
  }

  export default class PDFDocument {
    page: { width: number; height: number }
    y: number

    constructor(options?: PDFDocumentOptions)

    on(event: 'data', listener: (chunk: Buffer) => void): this
    on(event: 'end', listener: () => void): this
    on(event: 'error', listener: (error: Error) => void): this

    save(): this
    restore(): this
    opacity(value: number): this
    image(src: Buffer | string, x: number, y: number, options?: PDFImageOptions): this
    fillColor(color: string): this
    fontSize(size: number): this
    font(name: string): this
    text(text: string, x?: number | PDFTextOptions, y?: number | PDFTextOptions, options?: PDFTextOptions): this
    moveTo(x: number, y: number): this
    lineTo(x: number, y: number): this
    strokeColor(color: string): this
    lineWidth(width: number): this
    stroke(): this
    rect(x: number, y: number, width: number, height: number): this
    fill(): this
    addPage(options?: PDFDocumentOptions): this
    end(): this
  }
}

declare module 'resend' {
  export type SendEmailOptions = {
    from?: string
    to: string | string[]
    cc?: string | string[]
    bcc?: string | string[]
    subject: string
    text?: string
    html?: string
    headers?: Record<string, string>
    attachments?: Array<{
      filename: string
      content: string
    }>
  }

  export type SendEmailResponse = {
    data?: { id?: string }
    error?: string
  }

  export class Resend {
    constructor(apiKey: string)
    emails: {
      send(options: SendEmailOptions): Promise<SendEmailResponse>
    }
  }
}

declare module '@react-email/components' {
  type HtmlProps = import('react').DetailedHTMLProps<
    import('react').HtmlHTMLAttributes<HTMLHtmlElement>,
    HTMLHtmlElement
  >
  type HeadProps = import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLHeadElement>, HTMLHeadElement>
  type BodyProps = import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLBodyElement>, HTMLBodyElement>
  type TableProps = import('react').DetailedHTMLProps<
    import('react').TableHTMLAttributes<HTMLTableElement>,
    HTMLTableElement
  >
  type ParagraphProps = import('react').DetailedHTMLProps<
    import('react').HTMLAttributes<HTMLParagraphElement>,
    HTMLParagraphElement
  >

  export const Html: import('react').ForwardRefExoticComponent<
    HtmlProps & import('react').RefAttributes<HTMLHtmlElement>
  >
  export const Head: import('react').ForwardRefExoticComponent<
    HeadProps & import('react').RefAttributes<HTMLHeadElement>
  >
  export const Body: import('react').ForwardRefExoticComponent<
    BodyProps & import('react').RefAttributes<HTMLBodyElement>
  >
  export const Container: import('react').ForwardRefExoticComponent<
    TableProps & import('react').RefAttributes<HTMLTableElement>
  >
  export const Section: import('react').ForwardRefExoticComponent<
    TableProps & import('react').RefAttributes<HTMLTableElement>
  >
  export const Text: import('react').ForwardRefExoticComponent<
    ParagraphProps & import('react').RefAttributes<HTMLParagraphElement>
  >
}
