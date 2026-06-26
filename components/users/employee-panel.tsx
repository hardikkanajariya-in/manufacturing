"use client";

import { useState } from "react";
import { Users, UserPlus, Mail, Phone, Shield } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn, type DataTableFilter } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Employee, UserRole } from "@/lib/types";

const roleStyles: Record<UserRole, string> = {
  Manager: "bg-primary/10 text-primary border-primary/20",
  Operator: "bg-muted text-muted-foreground border-border",
  Admin: "bg-accent text-accent-foreground border-border",
};

export function EmployeePanel() {
  const { employees, activeUnit, addEmployee, updateEmployee } = useManufacturing();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [shift, setShift] = useState("Shift A (06:00 – 14:00)");
  const [role, setRole] = useState<UserRole>("Operator");

  const activeCount = employees.filter((e) => e.isActive).length;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setEmployeeId("");
    setShift("Shift A (06:00 – 14:00)");
    setRole("Operator");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !employeeId.trim()) return;
    addEmployee({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      employeeId: employeeId.trim(),
      shift,
      role,
      unitId: activeUnit.id,
      isActive: true,
    });
    setDialogOpen(false);
    resetForm();
  };

  const toggleActive = (id: string, currentlyActive: boolean) => {
    updateEmployee(id, { isActive: !currentlyActive });
  };

  const employeeTable = useDataTable<Employee>({
    data: employees,
    pageSize: 10,
    initialSort: { columnId: "name", direction: "asc" },
    searchFn: (row, q) =>
      [row.name, row.email, row.employeeId, row.role].join(" ").toLowerCase().includes(q),
    filterFn: (row, filters) => {
      if (filters.role && filters.role !== "all" && row.role !== filters.role) return false;
      if (filters.status && filters.status !== "all") {
        if (filters.status === "active" && !row.isActive) return false;
        if (filters.status === "inactive" && row.isActive) return false;
      }
      return true;
    },
    getSortValue: (row, col) => {
      if (col === "name") return row.name;
      if (col === "shift") return row.shift;
      if (col === "role") return row.role;
      return row.isActive ? 1 : 0;
    },
  });

  const employeeColumns: DataTableColumn<Employee>[] = [
    {
      id: "name",
      header: "Employee",
      sortable: true,
      cell: (e) => (
        <div>
          <p className="font-medium">{e.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{e.employeeId}</p>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      cell: (e) => (
        <div>
          <p className="text-xs flex items-center gap-1 text-muted-foreground">
            <Mail className="size-3" /> {e.email}
          </p>
          {e.phone && (
            <p className="text-xs flex items-center gap-1 text-muted-foreground mt-0.5">
              <Phone className="size-3" /> {e.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "shift",
      header: "Shift",
      sortable: true,
      cell: (e) => <span className="text-xs">{e.shift}</span>,
    },
    {
      id: "role",
      header: "Role",
      sortable: true,
      cell: (e) => (
        <Badge variant="outline" className={cn("text-[10px]", roleStyles[e.role])}>
          <Shield className="size-3 mr-1" />
          {e.role}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (e) => (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            e.isActive ? "text-success border-success/30" : "text-muted-foreground"
          )}
        >
          {e.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "action",
      header: "Action",
      className: "text-right",
      headerClassName: "text-right",
      cell: (e) => (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() => toggleActive(e.id, e.isActive)}
        >
          {e.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  const employeeFilters: DataTableFilter[] = [
    {
      id: "role",
      label: "Role",
      allLabel: "All roles",
      options: [
        { value: "Manager", label: "Manager" },
        { value: "Operator", label: "Operator" },
        { value: "Admin", label: "Admin" },
      ],
    },
    {
      id: "status",
      label: "Status",
      allLabel: "All statuses",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="kpi-label">Team members</p>
              <p className="text-2xl font-bold mt-1">{employees.length}</p>
            </div>
            <Users className="size-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="kpi-label">Active employees</p>
            <p className="text-2xl font-bold mt-1 text-success">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="kpi-label">Unit</p>
            <p className="text-sm font-semibold mt-1">{activeUnit.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activeUnit.location}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
          <CardTitle className="section-title">Employee directory</CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <UserPlus className="size-4" />
            Add employee
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            table={employeeTable}
            columns={employeeColumns}
            getRowKey={(e) => e.id}
            searchPlaceholder="Search employees…"
            filters={employeeFilters}
            emptyMessage="No employees registered for this unit."
            rowClassName={(e) => (!e.isActive ? "opacity-50" : undefined)}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add employee — {activeUnit.code}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="emp-name">Full name</Label>
                <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-id">Employee ID</Label>
                <Input id="emp-id" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="CP-0000" required />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operator">Operator</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="emp-email">Email</Label>
                <Input id="emp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@cementpro.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-phone">Phone</Label>
                <Input id="emp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-shift">Shift</Label>
                <Input id="emp-shift" value={shift} onChange={(e) => setShift(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add employee</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
