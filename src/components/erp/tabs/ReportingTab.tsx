import React from 'react';
import ReportingDesk from '../../ReportingDesk';
import { ClinicSettings, User } from '../../../types';

interface ReportingTabProps {
  clinicSettings?: ClinicSettings;
  currentUser?: User | null;
}

export const ReportingTab: React.FC<ReportingTabProps> = ({
  clinicSettings,
  currentUser = null,
}) => {
  return (
    <div className="space-y-6">
      <ReportingDesk clinicSettings={clinicSettings} currentUser={currentUser} />
    </div>
  );
};

export default ReportingTab;
