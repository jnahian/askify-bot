import prisma from '../lib/prisma';

export interface TemplateConfig {
  pollType: string;
  options: string[];
  description?: string;
  settings: {
    anonymous: boolean;
    allowVoteChange: boolean;
    liveResults: boolean;
    ratingScale?: number;
  };
  closeMethod: string;
  durationHours?: number;
}

export interface PollTemplate {
  id: string;
  userId: string;
  name: string;
  config: TemplateConfig;
  createdAt: Date;
}

export async function saveTemplate(
  userId: string,
  name: string,
  config: TemplateConfig,
): Promise<PollTemplate> {
  const template = await prisma.pollTemplate.create({
    data: {
      userId,
      name,
      config: JSON.parse(JSON.stringify(config)),
    },
  });
  return template as unknown as PollTemplate;
}

export async function getTemplates(userId: string): Promise<PollTemplate[]> {
  const templates = await prisma.pollTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return templates as unknown as PollTemplate[];
}

export async function getTemplate(templateId: string): Promise<PollTemplate | null> {
  const template = await prisma.pollTemplate.findUnique({
    where: { id: templateId },
  });
  return template as unknown as PollTemplate | null;
}

export async function deleteTemplate(templateId: string, userId: string): Promise<boolean> {
  const template = await prisma.pollTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template || template.userId !== userId) return false;

  await prisma.pollTemplate.delete({ where: { id: templateId } });
  return true;
}
