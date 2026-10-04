import http from '@/services/index';

export type OrgSettings = {
    id: string;
    organizationId: string;
    shiftDurationHours: string;
    shiftMode: 'single' | 'double';
    createdAt: string;
    updatedAt: string;
};

const getSettings = async (): Promise<OrgSettings> => {
    const res = await http.get<OrgSettings>('/api/internal/organization-settings');
    return res.body;
};

const updateSettings = async (
    payload: Partial<Pick<OrgSettings, 'shiftDurationHours' | 'shiftMode'>>
): Promise<OrgSettings> => {
    const res = await http.put<OrgSettings>('/api/internal/organization-settings', {
        body: payload,
    });
    return res.body;
};

const orgSettingsService = {
    getSettings,
    updateSettings,
};

export default orgSettingsService;