export type MiningSection = {
  id: string;
  name: string;
  createdAt: string;
};

export type MiningSectionResponse = {
  data: MiningSection[];
  totalCount: number;
};

export type CreateMiningSectionInput = {
  name: string;
};
