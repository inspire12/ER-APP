export type DiseaseTemplate = {
  id: number;
  name: string;
  aliases: string;
  medication: string;
  education: string;
  warningSigns: string;
  active: boolean;
};

export type ClinicalAnalysis = {
  diagnosis: string;
  templateName: string;
  findings: string;
  medicationNote: string;
};

export type DischargeContent = {
  diagnosis: string;
  findings: string;
  medication: string;
  education: string;
  warningSigns: string;
  templateId?: number;
};
