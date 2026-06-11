'use server'

import PDFDocument from 'pdfkit'
import sharp from 'sharp'

export interface COCInput {
  fullName: string
  cocNumber: string
}

const fmtDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

/**
 * Generates a single-page Personal Accident Insurance
 * Confirmation of Cover (COC) PDF and returns it as a base64 string.
 */
export async function generateCOCPDF({
  fullName,
  cocNumber,
}: COCInput): Promise<string> {
  const issueDate = new Date()
  const expiryDate = new Date(issueDate)
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)

  const issueDateStr = fmtDate(issueDate)
  const termStr = `${issueDateStr} - ${fmtDate(expiryDate)}`
  const nameUpper = (fullName ?? '').toUpperCase()

  // PDFKit renders this source watermark incorrectly when it is embedded
  // directly as a paletted PNG, so normalize it to a full RGBA PNG first.
  const [logoBuffer, rawWatermarkBuffer] = await Promise.all([
    fetch(
      'https://res.cloudinary.com/dx0heqhhe/image/upload/q_auto/f_auto/v1775642743/mercantile-logo_dpj4kh.svg',
    )
      .then((r) => r.arrayBuffer())
      .then((b) => Buffer.from(b)),
    fetch(
      'https://res.cloudinary.com/dx0heqhhe/image/upload/q_auto/f_auto/v1775642761/mercantile_k6a6nc.png',
    )
      .then((r) => r.arrayBuffer())
      .then((b) => Buffer.from(b)),
  ])
  const [watermarkMeta, watermarkBuffer] = await Promise.all([
    sharp(rawWatermarkBuffer).metadata(),
    sharp(rawWatermarkBuffer).ensureAlpha().png({palette: false}).toBuffer(),
  ])

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {top: 40, bottom: 40, left: 50, right: 50},
      info: {
        Title: 'Confirmation of Cover – Personal Accident Insurance',
        Author: 'Mercantile Insurance Co., Inc.',
        Subject: 'Personal Accident Insurance Confirmation of Cover',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const L = 50 // left margin
    const W = 495.28 // usable width (595.28 − 2 × 50)
    const col1W = W / 2 // equal 50/50 column split
    const col2W = W / 2
    const watermarkAspectRatio =
      watermarkMeta.width && watermarkMeta.height
        ? watermarkMeta.height / watermarkMeta.width
        : 608 / 869

    const stampWatermark = ({
      width = doc.page.width * 0.58,
      x = (doc.page.width - width) / 2,
      y = (doc.page.height - width * watermarkAspectRatio) / 2,
      opacity = 0.5,
    }: {
      width?: number
      x?: number
      y?: number
      opacity?: number
    } = {}) => {
      const wmH = width * watermarkAspectRatio

      doc.save()
      doc.opacity(opacity)
      doc.image(watermarkBuffer, x, y, {width, height: wmH})
      doc.restore()
    }

    let y = 40

    // ── LOGO (1/3 of content width) ──────────────────────────────
    const logoW = W / 3 // ≈ 165 pt
    const logoAreaH = 58 // reserved vertical space for the logo row

    doc.image(logoBuffer, L, y, {width: logoW})

    // Company address (right two-thirds of header)
    const ax = L + logoW + 48
    const aw = W - logoW - 12
    doc
      .fillColor('#111')
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Mercantile Insurance Building, General Luna St. corner Beatrio St.',
        ax,
        y + 2,
        {width: aw, lineBreak: false},
      )
      .text('Intramuros, Manila, Philippines', ax, y + 12, {
        width: aw,
        lineBreak: false,
      })
      .text(
        '(+632) 8527-7701 to 20  \u2022  gen_info@mic.com.ph  \u2022  www.mercantile.ph',
        ax,
        y + 22,
        {width: aw, lineBreak: false},
      )

    y += logoAreaH + 10

    // Separator
    doc
      .moveTo(L, y)
      .lineTo(L + W, y)
      .strokeColor('#FFF')
      .lineWidth(0.5)
      .stroke()
    y += 8

    // ── DATE / COC NO ────────────────────────────────────────────
    doc
      .fillColor('#111')
      .fontSize(9)
      .font('Helvetica')
      .text(`Date: ${issueDateStr}`, L, y, {lineBreak: false})
    doc.font('Helvetica-Bold').text(`COC NO.: ${cocNumber}`, L, y, {
      align: 'right',
      width: W,
      lineBreak: false,
    })
    y += 18

    // ── TITLE ────────────────────────────────────────────────────
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('CONFIRMATION OF COVER', L, y, {align: 'center', width: W})
    y = doc.y + 10

    // ── TO WHOM / INTRO ──────────────────────────────────────────
    doc
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('TO WHOM IT MAY CONCERN:', L, y)
    y = doc.y + 8

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .text('    This is to certify that Ms./Mr. ', L, y, {
        continued: true,
        width: W,
      })
      .font('Helvetica-Bold')
      .text(nameUpper, {continued: true})
      .font('Helvetica')
      .text(
        ' has procured Personal Accident Insurance Coverage from the MERCANTILE INSURANCE CO., INC. and effect in accordance with the terms and conditions of this policy.',
        {width: W},
      )
    y = doc.y + 10

    // ── POLICY DETAILS TABLE ─────────────────────────────────────
    const pRows: [string, string][] = [
      ['ASSURED NAME', `Mr./Ms. ${nameUpper}`],
      ['POLICY NUMBER', `COC NO: ${cocNumber}`],
      ['TERM OF INSURANCE', termStr],
      ['GEOGRAPHICAL LIMIT', 'WITHIN REPUBLIC OF THE PHILIPPINES'],
    ]
    const pRowH = 22

    for (let i = 0; i < pRows.length; i++) {
      const ry = y + i * pRowH
      doc.rect(L, ry, col1W, pRowH).strokeColor('#666').lineWidth(0.5).stroke()
      doc
        .rect(L + col1W, ry, col2W, pRowH)
        .strokeColor('#666')
        .lineWidth(0.5)
        .stroke()
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#111')
        .text(pRows[i][0], L + 6, ry + 7, {width: col1W - 12, lineBreak: false})
      doc.text(pRows[i][1], L + col1W + 6, ry + 7, {
        width: col2W - 12,
        align: 'center',
        lineBreak: false,
      })
    }
    y += pRows.length * pRowH

    // ── SCHEDULE OF BENEFITS TABLE ───────────────────────────────
    const bHeaderH = 22
    doc.rect(L, y, W, bHeaderH).fillColor('#74e40b').fill()
    doc.rect(L, y, W, bHeaderH).strokeColor('#666').lineWidth(0.5).stroke()
    doc
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('SCHEDULE OF BENEFITS & SUM INSURED:', L, y + 5, {
        width: W,
        align: 'center',
        lineBreak: false,
      })
    y += bHeaderH

    const bSubH = 22
    doc.rect(L, y, col1W, bSubH).strokeColor('#777').lineWidth(0.5).stroke()
    doc
      .rect(L + col1W, y, col2W, bSubH)
      .strokeColor('#777')
      .lineWidth(0.5)
      .stroke()
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('Coverage per person due to accident related only', L + 5, y + 3, {
        width: col1W - 10,
        lineBreak: false,
      })
      .text('LIMIT OF LIABILITY', L + col1W + 5, y + 3, {
        width: col2W - 10,
        align: 'center',
        lineBreak: false,
      })
    y += bSubH

    const benefits: [string, string][] = [
      ['Accidental Death & Disablement', '100,000'],
      ['Permanent Total Disability', '100,000'],
      ['Unprovoked Murder and Assault', '100,000'],
      ['Accidental Death due to Motorcycling', '50,000'],
      ['Accidental Medical Reimbursement', '5,000'],
      ['Accidental Burial Expense', '15,000'],
    ]
    const bRowH = 22
    const benefitsRowsH = benefits.length * bRowH
    const pageOneWatermarkW = W * 0.46
    const pageOneWatermarkH = pageOneWatermarkW * watermarkAspectRatio

    stampWatermark({
      width: pageOneWatermarkW,
      x: L + (W - pageOneWatermarkW) / 2,
      y: y + (benefitsRowsH - pageOneWatermarkH) / 2 - 8,
      opacity: 0.1,
    })

    for (let i = 0; i < benefits.length; i++) {
      const ry = y + i * bRowH
      doc.rect(L, ry, col1W, bRowH).strokeColor('#aaa').lineWidth(0.3).stroke()
      doc
        .rect(L + col1W, ry, col2W, bRowH)
        .strokeColor('#aaa')
        .lineWidth(0.3)
        .stroke()
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#111')
        .text(benefits[i][0], L + 5, ry + 4, {
          width: col1W - 10,
          lineBreak: false,
        })
        .text(benefits[i][1], L + col1W + 5, ry + 4, {
          width: col2W - 10,
          align: 'center',
          lineBreak: false,
        })
    }
    y += benefits.length * bRowH + 10

    // ── IRREVOCABLE STATEMENT ────────────────────────────────────
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#111')
      .text(
        "As such, said policy is irrevocable, subject however to the provisions of the law and shall be in full force and effect despite the non-presentation of company's official receipt.",
        L,
        y,
        {width: W},
      )
    y = doc.y + 10

    doc.text(
      `This confirmation of cover is being issued ${issueDateStr}`,
      L,
      y,
      {width: W},
    )
    y = doc.y + 12

    // ── SCOPE OF COVERAGE ────────────────────────────────────────
    doc.fontSize(8.5).font('Helvetica-Bold').text('SCOPE OF COVERAGE', L, y)
    y = doc.y + 8

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'The plan covers 24 hours a day (on and off the job), within cover period, against loss of life or bodily injury resulting solely, directly and independently of all other causes from an accident caused by external, violent and visible means.',
        L,
        y,
        {width: W},
      )
    y = doc.y + 10

    // ── POLICY CONDITIONS ────────────────────────────────────────
    doc.fontSize(8.5).font('Helvetica-Bold').text('POLICY CONDITIONS:', L, y)
    y = doc.y + 8

    doc
      .fontSize(7.5)
      .font('Helvetica')
      .text(
        '1.  The persons eligible to participate in this Group PA insurance are the actively at work Regular, Full-time, Probationary and Project Employees of the above-captioned assured, whose names are declared in the policy and insurance ages between 18 but not over 65 years old. In good health, physical and mental condition, no infirmities of the sight or sense of hearing; no physical deformity or handicap such as absence of one or both hands, feet or eyes and is not declined for life insurance or any form of Personal Accident cover.',
        L,
        y,
        {width: W},
      )
    y = doc.y + 3

    doc.text(
      "2.  All benefits payable under this policy shall be paid to individuals named insured's declared beneficiary/ies or compulsory heirs as their interest may appear.",
      L,
      y,
      {width: W},
    )
    y = doc.y + 3

    doc.text(
      '3.  Subject to the following Extension of Cover:\n         ￮  Accidental Food and Drinks Poisoning (presence of deleterious matter on food and drinks and not as a result of spoilage/expiration)\n         \uFFEE  Accidental Drowning\n         ￮  Commercial flying (as fare paying passengers)\n        \u25e6  Motorcycling risk (as mode of transportation including motorcycle and tricycle) warranted with Helmet Warranty and Non-Violation Warranty',
      L,
      y,
      {width: W},
    )

    // ════════════════════════════════════════════════════════════
    // PAGE 2
    // ════════════════════════════════════════════════════════════
    doc.addPage()
    stampWatermark()
    y = 40

    const body = (text: string) => {
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#111')
        .text(text, L, y, {width: W})
      y = doc.y + 3
    }
    const bold = (text: string) => {
      doc
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .fillColor('#111')
        .text(text, L, y, {width: W})
      y = doc.y + 3
    }
    const section = (text: string) => {
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#111')
        .text(text, L, y, {width: W})
      y = doc.y + 5
    }
    const gap = (n = 5) => {
      y += n
    }

    // Policy conditions continuation

    gap(2)
    body(
      '4.  Subject to the following Warranties, Clauses and Endorsements:\n         \u25e6  Age Limit Clause\n         \u25e6  Policy Covers/Benefits\n         \u25e6  Termination of Accident Contract Endorsement\n         \u25e6  Murder and Assault Endorsement\n         \u25e6  Motorcycling Endorsement\n         \u25e6  Accident Burial Assistance Warranty\n         \u25e6  Sabotage and Terrorism Exclusion Endorsement\n         \u25e6  Sanction Limitation Clause\n         \u25e6  Payment of Documentary Stamps Tax Warranty',
    )
    gap(2)
    body(
      '5.  Subject to the Mercantile Insurance Co., Inc. standard PA terms and conditions, clauses and warranties.',
    )
    gap(2)
    body(
      '6.  Subject to Accumulation Loss Limit of Php200,000,000.00 any one Group.',
    )
    gap(2)
    body(
      "7.  Inclusion / deletion of members will be made through endorsement and the effective date of a member's insurance shall be the date his/her name is declared to MICI GPA Policy. Pro-rata premium computation will be applied. No refund premium for the Insured with filed claim in case of deletion. No coverage is in effect for undeclared members.",
    )
    gap(8)

    section('GENERAL EXCLUSIONS:')
    bold('The Policy does not cover:')
    gap(2)
    body(
      '1.  Death, disablement or injuries occasioned by or happening through:',
    )
    body(
      '    1. War, Invasion, Act of Foreign Enemy, Hostilities (whether war be declared or not), Civil war, Rebellion, Insurrection, Terrorism, Mutiny or Crowd disturbances, Military or Usurped Power or Popular Uprising; or any warlike operations, Riot, Strike and Civil Commotion.',
    )
    body(
      '    2. Intentionally self-inflicted injuries, Suicide or Attempted suicide (whether felonious or not), while sane or insane; Alcoholism or under the influence of alcohol, drug addiction; HIV, AIDS, sexually transmitted and venereal diseases.',
    )
    body('    3. Earthquake, Volcanic Eruption, or Tidal Wave.')
    body('    4. Ionising radiations or contaminations by radioactivity.')
    body(
      '    5. Bacterial infections (except pyogenic infections which shall occur through an accidental cut or wound).',
    )
    gap(2)
    body(
      '2.  Whilst the Insured is traveling in an aircraft other than one licensed for public passenger service and operated by a regular Airline on a published schedule flight over a regular air route between two definitely established airports and in which the Insured is traveling as ticket-holding passenger; (extended to be covered in Commercial Flying as fare paying passenger)',
    )
    gap(2)
    body(
      '3.  Consequent upon the Insured engaging in hunting, racing of all kinds, steeple chasing, polo playing, motorcycle riding or driving, trekking/climbing and mountaineering, winter sports, ice hockey, football, yachting, or using woodworking machinery driven by mechanical power, scuba diving and other offshore activities, mountain biking, off road biking, parachuting, hang-gliding, professional sports with the exception of basketball, or racing other than on foot, participating in any dangerous sports and contact sports such as taekwondo, boxing, muay thai and alike; (extended to be covered in Motorcycling as mode of transportation)',
    )
    gap(2)
    body(
      '4.  Murder and Assault or any attempt thereat; (extended to be covered \u201cif unprovoked\u201d)',
    )
    gap(2)
    body(
      '5.  Caused directly or indirectly by the bad faith of the Insured, by his/her participation in criminal acts, or as a result of his/her fraudulent, seriously negligent or reckless actions. The consequences of the actions of the Insured in a state of derangement or under psychiatric treatment are not covered either;',
    )
    gap(2)
    body('6.  Whilst engaging in military duty;')
    gap(2)
    body('7.  Illegal acts or violations of the law;')
    gap(2)
    body(
      '8.  Whilst the Insured takes part in bets, challenges, or brawls, save in the case of legitimate defense or necessity;',
    )
    gap(2)
    body(
      '9.  Activities engaged in any duty directly or indirectly pertaining to the following occupations: Aviator, steward/ess, individual connected with the military and police, missionaries, miners and underground workers, individual involved in the manufacturing processing of nuclear materials and explosives, individual with constant contact with hazardous chemicals, individuals connected with politics, detective, bodyguards, bullfighters, divers, equestrians and jockeys, firemen, fishermen, fishing crew and any offshore activities or training, logging workers, circus workers, stuntmen, acrobats, steeplejacks, quarry workers, secret agents, loggers, sawmill workers, racers, sailors, seaman and window cleaners of a high-rise buildings;',
    )
    gap(2)
    body('10. Congenital anomalies and conditions;')
    gap(2)
    body(
      '11. Pregnancy, childbirth and miscarriage or any related conditions with respect to woman.',
    )
    gap(2)
    body('12. Pre-existing conditions are not covered.')
    gap(2)
    body(
      '13. General exclusions in accidental dental benefits include preexisting dental conditions, injuries caused by chewing or biting, cosmetic procedures (treatments aimed at improving the appearance of teeth, gums, and smile, including whitening, veneers, bonding, and orthodontics) and treatments that are not medically necessary.',
    )
    gap(2)
    body(
      '14. Hospital confinement for:\n    1. Rest cures\n    2. Periodic check ups\n    3. Cosmetic or plastic surgery\n    4. Any dental work, dental treatment or eye examination except as result of bodily injury',
    )

    // ════════════════════════════════════════════════════════════
    // PAGE 3
    // ════════════════════════════════════════════════════════════
    doc.addPage()
    stampWatermark()
    y = 40

    body('    5. Mental or nervous disorders')
    body(
      '    6. Any Rehabilitation treatments, Prostheses, orthopedic material or orhesis and osteosynthesis material, as well as spectacles',
    )
    body('    7. Insect / mosquito bites')
    gap(10)

    section('DEFINITIONS OF BENEFITS:')

    // Definition 1
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('1.  ACCIDENTAL DEATH', L, y, {continued: true, width: W})
    doc
      .font('Helvetica')
      .text(
        ' - Pays the full amount of the Principal Sum for accidental death occurring within twelve (12) months from the date of accident except motorcycling risk (with separate benefits stated in the policy schedule).',
        {width: W},
      )
    y = doc.y + 5

    // Definition 2
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('2.  PERMANENT DISABLEMENT', L, y, {continued: true, width: W})
    doc
      .font('Helvetica')
      .text(
        ' - Pays the corresponding percentages as stated in the Table of Permanent Disablement if bodily injury as aforesaid shall within twelve (12) calendar months from the date of accident result in permanent and total disablement and not followed within twelve (12) calendar months of the said bodily injury by the death of the Insured member.',
        {width: W},
      )
    y = doc.y + 5

    bold('         \u25e6  TABLE OF PERMANENT DISABLEMENT BENEFITS')
    gap(2)
    body(
      'Total and permanent disablement from engaging in or attending to employment or occupations of any and every kind - 100%',
    )
    body('Total and permanent loss of all sight in both eyes - 100%')
    body(
      'Total loss by physical severance or total permanent loss of use of:\n    1. One or two limbs   2. One or two hands   3. Arm above the elbow   4. Arm at or below the elbow\n    5. Leg above the knee   6. Leg at or below the knee   7. 100%',
    )
    gap(4)

    // Partial disablement compact table
    const pdtRows: [string, string][] = [
      ['Total and permanent loss of:', ''],
      ['Sight in one eye', '50%'],
      ['Lens of one eye', '50%'],
      ['Total loss by physical severance or:', ''],
      ['Thumb and four fingers of one hand', '50%'],
      ['Four fingers of one hand', '40%'],
      ['Thumb (two phalanges)', '25%'],
      ['Thumb (one phalanx)', '10%'],
      ['Index finger (three phalanges)', '15%'],
      ['Index finger (two phalanges)', '8%'],
      ['Index finger (one phalanx)', '4%'],
      ['Middle finger (three phalanges)', '10%'],
      ['Middle finger (two phalanges)', '4%'],
      ['Middle finger (one phalanx)', '2%'],
      ['Ring finger (three phalanges)', '8%'],
      ['Ring finger (two phalanges)', '4%'],
      ['Ring finger (one phalanx)', '2%'],
      ['Little finger (three phalanges)', '6%'],
      ['Little finger (two phalanges)', '3%'],
      ['Little finger (one phalanx)', '2%'],
      ['All toes of one foot', '7%'],
      ['Great toe (two phalanges)', '5%'],
      ['Great toe (one phalanx)', '2%'],
      ['Any other toe', '3%'],
      ['Total permanent loss of:', ''],
      ['Hearing in two ears', '75%'],
      ['Hearing in one ear', '38%'],
      ['Speech', '50%'],
    ]

    const pdtRowH = 12
    const pdtCol1 = W - 60
    const pdtCol2 = 60

    for (let i = 0; i < pdtRows.length; i++) {
      const ry = y + i * pdtRowH
      const [label, pct] = pdtRows[i]
      const isHeader = pct === ''
      doc
        .rect(L, ry, pdtCol1, pdtRowH)
        .strokeColor('#ccc')
        .lineWidth(0.3)
        .stroke()
      doc
        .rect(L + pdtCol1, ry, pdtCol2, pdtRowH)
        .strokeColor('#ccc')
        .lineWidth(0.3)
        .stroke()
      doc
        .fontSize(7)
        .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor('#111')
        .text(label, L + 4, ry + 3, {width: pdtCol1 - 8, lineBreak: false})
      if (pct) {
        doc.text(pct, L + pdtCol1 + 4, ry + 3, {
          width: pdtCol2 - 8,
          align: 'center',
          lineBreak: false,
        })
      }
    }
    y += pdtRows.length * pdtRowH + 5

    body(
      'The aggregate of all percentages payable in respect of any one accident shall not exceed 100%.',
    )
    gap(5)

    // Definition 3
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('3.  MEDICAL REIMBURSEMENT', L, y, {continued: true, width: W})
    doc
      .font('Helvetica')
      .text(
        ' - Pay the cost of all necessary medical or surgical treatment, hospital care, nursing service, x-rays and dressings and all other reasonable medical expenses incurred within three months from the date of accident, up to the limit stated in the schedule of benefit. (coverage is per person per year).\n\n    Medical reimbursement due to Animal bites can be covered if stated in the policy. The Insurance Company will pay the cost of all reasonable medical expenses resulting from Animal Bites, up to Php1,500.00 per person only (Official',
        {width: W},
      )
    y = doc.y + 3

    // ════════════════════════════════════════════════════════════
    // PAGE 4
    // ════════════════════════════════════════════════════════════
    doc.addPage()
    stampWatermark()
    y = 40

    body('Receipt is required). Aggregate limit per policy - Php60,000 only.')
    gap(5)

    // Definition 4
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('4.  ACCIDENTAL BURIAL BENEFIT', L, y, {continued: true, width: W})
    doc
      .font('Helvetica')
      .text(
        ' - Pays the Insured, in addition to all other benefits, the amount selected if death was due to accident except motorcycling risk (with separate benefits stated in the policy schedule).',
        {width: W},
      )
    y = doc.y + 5

    // Definition 5
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('5.  UNPROVOKED MURDER AND ASSAULT', L, y, {
        continued: true,
        width: W,
      })
    doc
      .font('Helvetica')
      .text(
        ' - Pays the Insured a Lump Sum benefit in the event of death resulting from murder and assault, up to the limit of benefit, subject to territorial limit occurring in the following geographical areas:',
        {width: W},
      )
    y = doc.y + 3
    body(
      '    1. Cotabato Provinces\n    2. Sulu Archipelago\n    3. Basilan\n    4. Maguindanao area\n    5. Lanao del Sur',
    )
    gap(5)

    // Definition 6
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('6.  MOTORCYCLING CLAUSE', L, y, {continued: true, width: W})
    doc
      .font('Helvetica')
      .text(
        ' - Pays the Insured against any and all kinds of accidents subject to the terms and conditions of the policy for death, disablement or bodily injury while driving or riding as a passenger on any two or three wheeled motorized vehicle, bicycle and/or sidecar for leisure or social purposes and not during any kind of racing, competition or any speed testing.',
        {width: W},
      )
    y = doc.y + 3
    body(
      "    \u25e6  Motorcycling related injuries or fatality shall not be covered if the insured person was found to have:\n         1. An expired or invalid driver's license\n         2. An expired vehicle registration\n         3. Been under the influence of alcohol or prohibited drugs\n         4. Been violating traffic laws and regulation\n         5. This also excludes the Insured person(s) while riding, pillion rider or driver, if not wearing any proper safety gear such as a crash helmet.",
    )
    gap(12)

    // Disclaimer
    doc
      .fontSize(7.5)
      .font('Helvetica-Oblique')
      .fillColor('#111')
      .text(
        'DISCLAIMER: Quotations confirmed and submitted by MICI based on incorrect information shall not be binding.',
        L,
        y,
        {width: W},
      )
    y = doc.y + 5
    body('This proposal is valid for 30 days from proposal date.')
    gap(5)
    body(
      'Should you have any further inquiries regarding our proposal, please do not hesitate to inform us immediately.',
    )
    gap(3)
    body('We look forward hearing from you soon')
    gap(3)
    body('Thank you.')
    gap(10)
    body('Sincerely,')
    gap(30) // space for signature

    // Signature block
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('Edwin V. Salvan', L, y, {width: W})
    y = doc.y + 2
    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor('#111')
      .text('Deputy COO', L, y, {width: W})
    y = doc.y + 2
    doc.text('Underwriting Department', L, y, {width: W})

    doc.end()
  })

  return buffer.toString('base64')
}
