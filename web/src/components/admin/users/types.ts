import {
  Users,
  GraduationCap,
  UserCog,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";

export type Role = "Student" | "Lecturer" | "Expert" | "Admin";
export type Status = "Active" | "Inactive" | "Pending";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role | "Unassigned";
  status: Status;
  joinedAt: string;
  className?: string; // Optional for non-students
}

export const initialUsers: User[] = [
  {
    id: "1",
    name: "Nguyen Van A",
    email: "nguyenvana@edu.vn",
    role: "Student",
    status: "Active",
    joinedAt: "2025-09-01",
    className: "SE1801",
  },
  {
    id: "2",
    name: "Tran Thi B",
    email: "tranthib@edu.vn",
    role: "Student",
    status: "Active",
    joinedAt: "2025-09-01",
    className: "SE1801",
  },
  {
    id: "7",
    name: "Dang Van G",
    email: "dangvang@edu.vn",
    role: "Student",
    status: "Pending",
    joinedAt: "2026-01-10",
    className: "SE1801",
  },
  {
    id: "11",
    name: "Dr. Nguyen Minh",
    email: "nguyenminh@edu.vn",
    role: "Lecturer",
    status: "Active",
    joinedAt: "2024-08-01",
  },
  {
    id: "17",
    name: "New Teacher",
    email: "newteacher@edu.vn",
    role: "Unassigned",
    status: "Pending",
    joinedAt: "2026-02-15",
  },
  {
    id: "18",
    name: "Super Admin",
    email: "admin@bonevisqa.com",
    role: "Admin",
    status: "Active",
    joinedAt: "2024-01-01",
  },
];

export const roleConfig: Record<
  Role,
  { icon: typeof Users; color: string; bg: string }
> = {
  Student: { icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-100" },
  Lecturer: { icon: UserCog, color: "text-violet-600", bg: "bg-violet-100" },
  Expert: { icon: Stethoscope, color: "text-amber-600", bg: "bg-amber-100" },
  Admin: {
    icon: ShieldCheck,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
};

export const statusStyle: Record<Status, { dot: string; text: string; bg: string }> = {
  Active: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  Inactive: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
  Pending: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
};

export const allRoles: Role[] = ["Student", "Lecturer", "Expert", "Admin"];
