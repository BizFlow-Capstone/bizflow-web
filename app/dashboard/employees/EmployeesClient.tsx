"use client";

import { useState } from "react";
import { Search, Loader2, Users, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmployees } from "@/hooks/useEmployees";

export default function EmployeesClient() {
  const { data: employees, isLoading, error } = useEmployees();
  const [search, setSearch] = useState("");

  const filtered = employees?.filter((e) =>
    e.userName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-8 bg-gray-50">
        {employees && (
          <div className="mb-4">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Users className="w-4 h-4 mr-1" />
              {employees.length} nhân viên
            </Badge>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm nhân viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border p-8 text-center text-red-500">
            <p>Không thể tải danh sách nhân viên</p>
            <p className="text-sm mt-1 text-gray-500">{String(error)}</p>
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="bg-white rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Mã nhân viên</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp, i) => (
                  <TableRow key={emp.userId} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm text-gray-500">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-[#23C4C1] text-white text-xs">
                            {emp.userName
                              .split(" ")
                              .map((w) => w[0])
                              .slice(-2)
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-800">
                          {emp.userName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {emp.userId}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">
              {search ? "Không tìm thấy nhân viên" : "Chưa có nhân viên"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
