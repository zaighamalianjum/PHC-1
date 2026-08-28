import React from 'react';
import FiscalCalendarDesk from '../../FiscalCalendarDesk';
import { ClinicSettings, User } from '../../../types';

interface FiscalCalendarTabProps {
  clinicSettings?: ClinicSettings;
  currentUser?: User | null;
}

export const FiscalCalendarTab: React.FC<FiscalCalendarTabProps> = ({
  clinicSettings,
  currentUser = null,
}) => {
  return (
    <div className="space-y-6">
      <FiscalCalendarDesk clinicSettings={clinicSettings} currentUser={currentUser} />
    </div>
  );
};

export default FiscalCalendarTab;
