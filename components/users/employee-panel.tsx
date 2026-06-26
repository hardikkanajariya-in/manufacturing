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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

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
        <CardContent className="p-0">
          <div className="data-table-wrap border-0 rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No employees registered for this unit.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id} className={!employee.isActive ? "opacity-50" : undefined}>
                      <TableCell>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{employee.employeeId}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Mail className="size-3" /> {employee.email}
                        </p>
                        {employee.phone && (
                          <p className="text-xs flex items-center gap-1 text-muted-foreground mt-0.5">
                            <Phone className="size-3" /> {employee.phone}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{employee.shift}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", roleStyles[employee.role])}>
                          <Shield className="size-3 mr-1" />
                          {employee.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", employee.isActive ? "text-success border-success/30" : "text-muted-foreground")}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => toggleActive(employee.id, employee.isActive)}
                        >
                          {employee.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
