'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Camera, Save } from 'lucide-react';

// Mock data - sẽ thay bằng API calls
const initialProfile = {
  firstName: 'Nguyen Van',
  lastName: 'A',
  email: 'student@bonevisqa.com',
  phone: '0901234567',
  dateOfBirth: '2002-05-15',
  gender: 'male',
  studentId: 'SE171234',
  university: 'FPT University',
  faculty: 'Software Engineering',
  cohort: 'K20',
  academicYear: '4',
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call API to save profile
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen">
      <Header title="Profile" subtitle="Manage your personal information" />

      <div className="p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">{profile.studentId} - {profile.university}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-5">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-card-foreground mb-1.5">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-card-foreground mb-1.5">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-card-foreground mb-1.5">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-card-foreground mb-1.5">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-card-foreground mb-1.5">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-5">Academic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-card-foreground mb-1.5">
                  Student ID
                </label>
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  value={profile.studentId}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="university" className="block text-sm font-medium text-card-foreground mb-1.5">
                  University
                </label>
                <input
                  id="university"
                  name="university"
                  type="text"
                  value={profile.university}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="faculty" className="block text-sm font-medium text-card-foreground mb-1.5">
                  Faculty / Major
                </label>
                <input
                  id="faculty"
                  name="faculty"
                  type="text"
                  value={profile.faculty}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="cohort" className="block text-sm font-medium text-card-foreground mb-1.5">
                  Cohort
                </label>
                <input
                  id="cohort"
                  name="cohort"
                  type="text"
                  value={profile.cohort}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            {saved && (
              <span className="text-sm text-success font-medium">Profile saved successfully!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
