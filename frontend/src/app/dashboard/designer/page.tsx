"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DesignerDashboardOverview() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/designer/tasks");
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = tasks.filter(t => ["Assigned", "In Progress", "Changes Requested", "Returned to Designing Team"].includes(t.status)).length;
  const reviewCount = tasks.filter(t => t.status === "Ready for Review" || t.status === "Verification Pending").length;
  const completedCount = tasks.filter(t => t.status === "Completed").length;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold">Design Team Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">{pendingCount}</div>
            <p className="text-xs text-gray-400 mt-1">Require action</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-500">{reviewCount}</div>
            <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{completedCount}</div>
            <p className="text-xs text-gray-400 mt-1">Successfully designed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Turnaround</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">2.4d</div>
            <p className="text-xs text-gray-400 mt-1">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold border-b pb-2">My Work Queue</h2>
        {loading ? (
          <div>Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 border border-dashed rounded-lg text-center text-gray-500">No active tasks in your queue.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.filter(t => t.status !== "Completed").map(task => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg line-clamp-1" title={task.title}>{task.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {task.priority || 'Medium'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <Clock className="w-4 h-4" />
                    <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date set'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      {task.status}
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <a href="/dashboard/designer/kanban">View Board</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
