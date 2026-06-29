export interface FaqItem {
  question: string;
  answer: string;
}

export const INSTRUCTIONS_INTRO = `Procedure and guidelines for digitization of manual TDR certificates through APCRDA and the Online TDR Bank Application. Citizens and officers must follow the prescribed document checklist and approval workflow before a Development Rights Certificate is issued on the portal.`;

export const PORTAL_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What Is TDR?',
    answer:
      'Transfer of Development Rights (TDR) means making available certain amount of additional built up area in lieu of the area relinquished or surrendered by the owner of the land, so that he can use extra built up area either himself or transfer it to another in need of the extra built up area for an agreed sum of money.',
  },
  {
    question: 'Development Rights Certificate (DRC), Whether Transferable / Inheritable?',
    answer:
      'If the owner of any land which is required for road widening, formation of new roads or development of parks, play grounds, civic amenities etc., those proposed in the plan shall be eligible for the award of Transferable Development Rights. Such award will entitle the owner of the land in the form of a Development Rights Certificate (DRC), which he may use for himself or transfer to any other person. The certificate is transferable subject to rules prescribed by the Authority.',
  },
  {
    question: 'What Is The Process Of TDR Trading?',
    answer:
      'TDR trading involves listing available TDR extent in the TDR Bank, matching buyers and sellers, and recording the transfer through the official ledger. All transactions must be verified against the issued DRC and reflected in the permanent TDR ledger maintained by APCRDA.',
  },
  {
    question: 'Is There Any Time Limit For Utilization Of TDR Certificate?',
    answer:
      'Utilization timelines are governed by applicable G.O.s and rules issued by the Government of Andhra Pradesh. Applicants should refer to G.O. 207 MA&UD and subsequent amendments for validity and utilization conditions.',
  },
  {
    question: 'Whether The Already Issued Bonds Data Should Be Captured In The TDR Portal?',
    answer:
      'Yes. Offline bonds issued prior to digitization must be migrated into the portal through the prescribed 5-level approval workflow so that they appear in the public TDR Bank and verification registry.',
  },
  {
    question: 'Whether Already Issued Bonds Need To Be Applied In The New Application?',
    answer:
      'Existing certificate holders do not re-apply from scratch. Officers enter legacy bond data through the offline migration track; citizens may track status using the TDR certificate number on the Status page.',
  },
  {
    question:
      'Whether The Applicant Must Apply For TDR Bond Separately After The Allotment Of Returnable Plot For The Balance Area?',
    answer:
      'TDR is awarded for land surrendered for public purpose. Returnable plot allotment and TDR certificate issuance are separate entitlements governed by LPS guidelines. Applicants should consult the approving authority for their specific case.',
  },
];

export const HOW_TO_APPLY_STEPS = [
  'Fill your personal details and land details.',
  'Click on Save button. Your TDR Application number is displayed with Success message.',
  'Upload at least THREE documents (Sale Deed, Encumbrance Certificate & Market Value Certificate).',
  'Submit the application.',
  'You will receive a SMS and Email notifying the submitted TDR application.',
] as const;
