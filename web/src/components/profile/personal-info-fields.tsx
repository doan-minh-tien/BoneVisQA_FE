'use client';

export type PersonalInfoValues = {
  dateOfBirth: string;
  phoneNumber: string;
  gender: string;
  studentSchoolId: string;
  address: string;
  bio: string;
};

export const EMPTY_PERSONAL_INFO: PersonalInfoValues = {
  dateOfBirth: '',
  phoneNumber: '',
  gender: '',
  studentSchoolId: '',
  address: '',
  bio: '',
};

export function profileToPersonalValues(p: {
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  studentSchoolId?: string | null;
  address?: string | null;
  bio?: string | null;
}): PersonalInfoValues {
  return {
    dateOfBirth: p.dateOfBirth ?? '',
    phoneNumber: p.phoneNumber ?? '',
    gender: p.gender ?? '',
    studentSchoolId: p.studentSchoolId ?? '',
    address: p.address ?? '',
    bio: p.bio ?? '',
  };
}

/** For API: empty date → null */
export function personalValuesToApiPatch(v: PersonalInfoValues) {
  return {
    dateOfBirth: v.dateOfBirth.trim() ? v.dateOfBirth.trim().slice(0, 10) : null,
    phoneNumber: v.phoneNumber.trim() || undefined,
    gender: v.gender.trim() || undefined,
    studentSchoolId: v.studentSchoolId.trim() || undefined,
    address: v.address.trim() || undefined,
    bio: v.bio.trim() || undefined,
  };
}

export function PersonalInfoFields({
  values,
  onChange,
  idPrefix = 'pi',
}: {
  values: PersonalInfoValues;
  onChange: (next: PersonalInfoValues) => void;
  idPrefix?: string;
}) {
  const set = (patch: Partial<PersonalInfoValues>) => onChange({ ...values, ...patch });

  const inputCls =
    'w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <label htmlFor={`${idPrefix}-dob`} className="mb-1.5 block text-sm font-medium text-card-foreground">
          Date of birth
        </label>
        <input
          id={`${idPrefix}-dob`}
          type="date"
          value={values.dateOfBirth}
          onChange={(e) => set({ dateOfBirth: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-phone`} className="mb-1.5 block text-sm font-medium text-card-foreground">
          Phone
        </label>
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          value={values.phoneNumber}
          onChange={(e) => set({ phoneNumber: e.target.value })}
          placeholder="+84…"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-gender`} className="mb-1.5 block text-sm font-medium text-card-foreground">
          Gender
        </label>
        <select
          id={`${idPrefix}-gender`}
          value={values.gender}
          onChange={(e) => set({ gender: e.target.value })}
          className={inputCls}
        >
          <option value="">—</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label htmlFor={`${idPrefix}-addr`} className="mb-1.5 block text-sm font-medium text-card-foreground">
          Address
        </label>
        <input
          id={`${idPrefix}-addr`}
          type="text"
          value={values.address}
          onChange={(e) => set({ address: e.target.value })}
          className={inputCls}
        />
      </div>
    </div>
  );
}
