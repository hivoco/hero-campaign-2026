/**
 * Hero Destiny Fantasy World — combined Terms & Conditions and Privacy Notice.
 *
 * Verbatim from the legal PDF (20260717) — legally load-bearing, do NOT
 * paraphrase. Rendered by `src/app/terms/page.tsx`. Section F carries the
 * `privacy` anchor (the Privacy Notice spans F–M), so `/terms#privacy` jumps
 * straight to the data-collection section.
 */

export type LegalItem = {
  /** Bold lead-in (e.g. "The Campaign:") — optional. */
  lead?: string;
  text: string;
  /** Nested bullet points under this item. */
  bullets?: string[];
};

export type LegalSection = {
  letter: string; // "A", "B", …
  title: string;
  /** Anchor id override (e.g. "privacy"); defaults to `sec-<letter>`. */
  id?: string;
  /** Paragraphs shown above the numbered list. */
  intro?: string[];
  /** The numbered clauses. */
  items?: LegalItem[];
  /** Paragraphs shown below the numbered list. */
  outro?: string[];
};

export const LEGAL_TITLE = "Terms & Conditions and Privacy Notice";
export const LEGAL_SUBTITLE = "Hero Destiny Fantasy World";

export const LEGAL_INTRO: string[] = [
  `Welcome to Hero Destiny Fantasy World! This platform allows parents to create a limited-edition, hyper-personalised film (the “Video”) generated using Artificial Intelligence (“AI”), featuring the parent and their child together. The final output is delivered to the parent’s WhatsApp number.`,
  `By using our website/microsite destinistory.heromotocorp.com (“Platform”), you (“Participant”, “you”, or “your”)—being the parent of the child whose details are provided—unconditionally agree to comply with these Terms and Conditions (“Terms”). Because this campaign (the “Campaign”) involves processing personal data under the Digital Personal Data Protection Act, 2023 (“DPDP Act”) and the Digital Personal Data Protection Rules, 2025 (the “Rules”), please review these Terms thoroughly before proceeding.`,
];

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    letter: "A",
    title: "Details of the Campaign",
    items: [
      { lead: "The Campaign:", text: `Engage parents to provide a Video featuring the Participant and their child using photographs uploaded by the Participant. This Video will be delivered via WhatsApp.` },
      { lead: "Campaign Period:", text: `Commences on 22nd July, 2026 and continues until 1st September 2026. Hero MotoCorp Limited (the “Company”) reserves the right to shorten, extend, or terminate this period at its sole discretion without prior notice.` },
      { lead: "Data Fiduciary:", text: `Hero MotoCorp Limited.` },
      { lead: "Data Processor:", text: `HiVoco Content-Tech Studios (Audio First Commerce Pvt. Ltd.), acting strictly on behalf of and under instructions from the Company.` },
    ],
  },
  {
    letter: "B",
    title: "Participation Guidelines",
    intro: [`To participate, you must strictly follow these operational steps:`],
    items: [
      { text: `Visit the official microsite: destinistory.heromotocorp.com.` },
      { text: `Pass the eligibility gate by explicitly confirming you are 18+ years old and the lawful parent.` },
      { text: `Upload/capture a clear selfie of yourself with your child.` },
      { text: `Input your first name, your child's first name, parental display preference (e.g., Mom, Dad), and city (optional and subject to change).` },
      { text: `Provide your valid WhatsApp number for OTP verification and delivery of the Video.` },
      { text: `Review and execute the on-screen consents. Please see part E of the Terms.` },
      { text: `Complete One-Time Password (OTP) verification via WhatsApp.` },
      { text: `Upon successful validation, receive the Video on your verified WhatsApp number on the basis of your specific selections.` },
      { text: `In order to win the prize you must post the Video using #HeroKaScooterScooterKaHero tagline on social media platforms while tagging the Company.` },
    ],
  },
  {
    letter: "C",
    title: "Eligibility & Verifiable Parental Consent",
    items: [
      { lead: "Strict Age Limit:", text: `Participation is restricted strictly to individuals who are 18 years of age or older and are the parent of the child. Children are strictly prohibited from submitting data independently.` },
      {
        lead: "Verifiable Consent Mechanism:",
        text: `In strict compliance with the DPDP Act and the Rules, the Company shall ensure using a multi-layered verification mechanism:`,
        bullets: [
          `An explicit, affirmative digital declaration of age and relationship status.`,
          `Mandatory WhatsApp OTP verification.`,
          `Integration with DigiLocker or authorized-entity tokens.`,
        ],
      },
      { lead: "Absolute Parental Warranty:", text: `By submitting any data or photograph of a minor, you give an absolute warranty and representation to the Company that you possess full legal authority to act on behalf of the child. The expression “parent” is used in a gender-neutral sense and includes any parent, irrespective of gender or family structure. The Company relies on this warranty in good faith.` },
      { lead: "Right to Reject/Erase:", text: `If the Company has reason to suspect a breach of this warranty, or if OTP/identity verification fails, the Company reserves the right to immediately terminate the session, decline participation, and permanently erase any data collected without liability.` },
      { text: `Any label you may select for how the Video addresses you (for example Mom, Dad or Parent) is a display preference only and is not a statement of legal status. Your legal relationship to the child is governed solely by the warranty above.` },
    ],
  },
  {
    letter: "D",
    title: "Participant Conduct, Responsibilities & Absolute Indemnity",
    items: [
      { lead: "Accuracy of Data:", text: `You must provide accurate, current, and complete details. The Company is not responsible for delivery failures resulting from incorrect WhatsApp numbers or data inputs.` },
      { lead: "Third-Party Intellectual Property:", text: `You warrant that you own or possess explicit legal rights to the photographs/selfies uploaded. You must not upload images that infringe any third-party copyright, trademark, privacy, or publicity rights.` },
      { lead: "Prohibited Content:", text: `You are strictly prohibited from uploading any obscene, defamatory, profane, sexually explicit, politically sensitive, or otherwise unlawful/objectionable content.` },
      { lead: "Use of personalized Video:", text: `Participants must ensure that the Video is forwarded only to the intended recipient and is not used to harass, threaten or cause distress to any person who may be unwilling to receive it.` },
      { lead: "Disclaimer on Filtering:", text: `The Participant is solely and fully responsible for every image and all content they upload. Any content-screening, filtering or moderation employed by the Company is a good-faith, best-efforts measure and not a guarantee: if any obscene, profane, sexually explicit, offensive or otherwise objectionable image or content is not detected by, or passes through, the checkpoints employed by the Company, the Participant remains solely responsible and liable for it and the Company shall not be liable in any manner. The Company may, at its sole discretion, remove, refuse to process or report such content, and the Participant indemnifies the Company against any resulting claim, loss or liability.` },
    ],
  },
  {
    letter: "E",
    title: "On-Screen Consent Framework & Right to Withdraw",
    intro: [`In line with the DPDP Act and Rules, any consent taken herein is free, specific, informed, unconditional unambiguous and given by a clear affirmative action. All checkboxes are unticked by default.`],
    items: [
      { lead: "Mandatory Consents:", text: `Essential for the generation and delivery of the Video. Refusal prevents participation.` },
      { lead: "Withdrawal:", text: `You may withdraw consent at any time as easily as it was given (e.g., by replying 'STOP' on WhatsApp or contacting the Grievance Officer). Withdrawal will not affect processing executed prior to the withdrawal. Upon withdrawal, the Company will cease delivery and erase related data, subject to lawful retention requirements.` },
    ],
  },
  {
    letter: "F",
    id: "privacy",
    title: "Itemized Categories of Personal Data Collected",
    intro: [`To achieve the specified purposes, the Company limits collection to the following items:`],
    items: [
      { lead: "Parent identity & contact data", text: `— your first name, WhatsApp mobile number, and (optionally) your city.` },
      { lead: "Image data", text: `— the selfie you capture of yourself along with your child.` },
      { lead: "Child’s data", text: `— your child’s first name and photograph, used solely to personalize and render the Video. No other contact detail or sensitive attribute of the child is collected, and no biometric or other attribute of the child is inferred from the photograph.` },
      { lead: "Display preference", text: `— your optional choice of how the Video addresses you (a creative preference, not a legal-status field).` },
      { lead: "Verification data", text: `— OTP and verification status.` },
      { lead: "Technical & usage data", text: `— device, browser, IP address, cookies and interaction logs (of the adult Participant).` },
    ],
  },
  {
    letter: "G",
    title: "Purposes, Data Processors, and Cross-Border Transfers",
    items: [
      { lead: "Specified Purposes:", text: `Core processing is limited to verification, creation, and delivery of the Video.` },
      { lead: "Data Processors & Safeguards:", text: `The Company utilizes HiVoco Content-Tech Studios under strict written contracts pursuant to the DPDP Act.` },
      { lead: "No AI Training on User Assets:", text: `The Company explicitly mandates that no parent or child photographs shall be used to train, fine-tune, or improve any public or proprietary AI/LLM models managed by the processors or sub-processors.` },
      { lead: "Cross-Border Transfers:", text: `Data may be processed on secure global cloud instances managed by sub-processors. All transfers strictly comply with DPDP Act and the underlying Rules.` },
    ],
  },
  {
    letter: "H",
    title: "Data Retention & Mandatory Erasure",
    items: [
      { lead: "Transient Data Assets:", text: `Parent and child photographs used for Video generation will be permanently deleted from the active processing servers promptly after delivery of the Video, and in no event later than 1 day from upload of the photographs, regardless of any optional consents provided.` },
      { lead: "Campaign Core Data:", text: `Personal data collected for validation purposes or for delivery of the Video will be retained only until the expiration of the Campaign or 1 day post-closure, whichever is later, unless an active optional consent as per the Terms is active.` },
      { lead: "Statutory Logs:", text: `Pursuant to the Rules, systemic transaction and processing logs will be retained securely for a minimum period of one (1) year where required as per DPDP Act and underlying Rules.` },
    ],
  },
  {
    letter: "I",
    title: "Security Safeguards & Breach Management",
    items: [
      { lead: "Security Infrastructure:", text: `The Company shall employ robust technical and organizational security measures, including end-to-end encryption, data masking, strict access controls, and virtual tokenization to mitigate personal data breaches.` },
      { text: `The parent’s and child’s photographs are subject to heightened protection - access is restricted to the minimum personnel and systems required to generate the Video, and the images are erased as set out in Part H.` },
      { lead: "Breach Notification:", text: `In the unfortunate event of a personal data breach, the Company will notify the relevant authorities and you as per applicable laws.` },
    ],
  },
  {
    letter: "J",
    title: "Rights of the Data Principal",
    intro: [`As a data principal (and as the authorized representative of your child), you possess the right to Access, Correction, Completion, Erasure, and Nomination under the DPDP Act. You may execute these rights by reaching out to our Grievance Officer.`],
  },
  {
    letter: "K",
    title: "Grievance Redressal Mechanism",
    items: [
      { lead: "Email Address:", text: `GrievanceOfficer@heromotocorp.com` },
    ],
    outro: [`The Company will resolve grievances within the timelines mandated by our internal policy, not exceeding 90 days. In accordance with regulatory protocols, you must exhaust the Company’s internal grievance mechanism before escalating any dispute to the relevant judicial authorities or to the Data Protection Board of India (DPBI) as and when constituted.`],
  },
  {
    letter: "L",
    title: "Specific Restrictions on Children's Data",
    items: [
      { lead: "No Tracking or Profiling:", text: `In compliance with the DPDP Act, the Company will never track, profile, behaviorally monitor, or target advertisements at the child.` },
      { lead: "Well-being Shield:", text: `Data processing will not be conducted in any manner likely to cause a detrimental effect on the well-being of the minor.` },
      { lead: "No Public Advertising:", text: `The Company will never use the your or your child’s name, likeness, image, or video output in any corporate publicity, television commercial, or paid advertisement without explicit, separate legal instruments. Any optional consent taken from the parent for the above mentioned purposes applies exclusively to parent.` },
      { lead: "Exception for User-Initiated Social Sharing:", text: `If you choose to share your generated Video publicly on platforms like Instagram and tag the Company’s official handle, you grant the Company a non-exclusive, worldwide, royalty-free license to reshare that specific post. This remains active until you delete the post or remove the tag.` },
    ],
  },
  {
    letter: "M",
    title: "Intellectual Property & Limited Licensing",
    items: [
      { lead: "Company Ownership:", text: `The Company will remain the sole and exclusive owner of all right, title, and interest (including any intellectual property rights or other rights) in and to all Company brands, logos, creative and artistic works, designs, data, information, and materials owned or licensed by the Company (collectively, the “Company Materials”). Nothing in these Terms shall, whether expressly or by implication, be deemed to transfer any ownership interest in any Company Materials to you. All rights not expressly granted by the Company under these Terms are reserved by the Company.` },
      { lead: "Limited User License:", text: `Participants are granted a non-exclusive, non-transferable, non-sublicensable, revocable license to use, download, and share the final Video for strictly personal, non-commercial purposes. Any commercial exploitation, modification, or sale of the Video is strictly prohibited.` },
    ],
  },
  {
    letter: "N",
    title: "Prize, Winner Selection & Gratification Terms",
    items: [
      { lead: "The Prize:", text: `One (1) Hero Destini scooter awarded to 5 verified winners.` },
      { lead: "No Purchase Required:", text: `Entry into the contest is free of charge and requires no financial consideration.` },
      { lead: "Winner Selection Process:", text: `The Company will select the winners amongst the participants who post their Video on various social media websites while tagging the Company. A panel appointed by the Company will shortlist the winners based on engagement merit (for e.g., (i) number of likes on the Video; (ii) number of comments; (ii) number of re-shares etc.). The Company's decision is final, binding, and absolute; no appeals or disputes will be entertained.` },
      { lead: "Anti-Fraud Clause:", text: `The use of click-bots, fake accounts, script automation, or incentivized likes is strictly prohibited and results in immediate disqualification and erasure of data.` },
      { lead: "Claim & Forfeiture:", text: `Winners will be contacted via their verified WhatsApp number and must submit valid Government ID/KYC/Tax verification within seven (07) days. Failure to respond or provide clean KYC results in absolute forfeiture, and the Company may select an alternate winner.` },
      { lead: "Taxes:", text: `All applicable taxes, including Tax Deducted at Source (TDS) under Section 194B of the Income-tax Act, 1961 (currently 30% plus applicable surcharges), and statutory registration, insurance, or road taxes must be borne entirely by the winner. The Company will only release the prize after verifying proof of deposit of the mandatory TDS.` },
      { lead: "Liability Cap:", text: `To the maximum extent permitted under law, the Company's cumulative, aggregate liability to any Participant for any dispute arising out of the Campaign, the prize, or the Platform shall not exceed the verified ex-showroom cost of the prize. The Company is not liable for any indirect, special, or consequential damages.` },
    ],
  },
  {
    letter: "O",
    title: "Third-Party Services Disclaimer",
    intro: [`The Platform integrates third-party tools, cloud environments, and generative AI models (LLMs). By participating, you acknowledge that these tools are subject to external acceptable-use policies. The Company disclaims all liability for intermittent technical glitches, network latencies, or processing errors caused by external provider systems.`],
  },
  {
    letter: "P",
    title: "Governing Law, Jurisdiction and Dispute Resolution",
    items: [
      { text: `These Terms are governed by and construed in accordance with the laws of India. Any dispute, controversy or claim arising out of, relating to or having any connection with these Terms or the Campaign, shall be referred in writing to and finally resolved in accordance with the Arbitration and Conciliation Act, 1996 (“Arbitration Act”) as amended from time to time. The seat of the arbitration shall be in Delhi, India. The Tribunal shall consist of a sole arbitrator, mutually appointed by the parties. If the parties fail to appoint an arbitrator within 45 (forty-five) business days from the date of receipt of the request for appointment of arbitrator, the arbitrator shall be appointed as per the provisions of the Arbitration Act. The cost of the proceedings shall be equally borne by the Parties, unless otherwise determined by the sole arbitrator. The language of the arbitration shall be English. The award of such arbitrator shall be final and binding on the Parties and may be enforced by any court of competent jurisdiction.` },
      { text: `Subject to the provisions of clause P (1) above, the Parties irrevocably submit to the exclusive jurisdiction and venue of Delhi, India, for any such suit, action or proceeding.` },
    ],
  },
  {
    letter: "Q",
    title: "Integrated Consent Screen",
    intro: [
      `By proceeding, you explicitly agree to the Terms of this Campaign.`,
      `Mandatory Declarations:`,
      `“I confirm that I am 18 years of age or older, and I am the biological parent of the child whose details are provided, possessing full legal authority to execute these consents on their behalf.”`,
      `Data Approvals:`,
    ],
    items: [
      { lead: "Mandatory —", text: `I consent to the Company processing my name, my selfie, my child's first name, his/her photograph to generate our personalized video graphic film.` },
      { lead: "Mandatory —", text: `I consent to Hero MotoCorp Limited using my WhatsApp number to conduct an OTP verification, deliver the Video and send essential campaign details.` },
    ],
  },
];
