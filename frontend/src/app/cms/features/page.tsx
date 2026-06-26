"use client";

import { useEffect, useState } from "react";
import { ToggleLeft, Plus, Save, Trash2, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  is_enabled: boolean;
}

export default function FeaturesCMS() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      // In a real implementation this would fetch from the new backend API
      // const res = await fetch("/api/v1/cms/features");
      // const data = await res.json();
      
      // Mocking for preview
      setTimeout(() => {
        setFeatures([
          { id: "1", feature_key: "patent_search", feature_name: "Patent Search", description: "Global patent search tool", is_enabled: true },
          { id: "2", feature_key: "trademark_search", feature_name: "Trademark Search", description: "Global trademark and logo search tool", is_enabled: true },
          { id: "3", feature_key: "ai_assistant", feature_name: "AI Assistant", description: "AI chatbot and insights", is_enabled: false },
          { id: "4", feature_key: "novelty_engine", feature_name: "Novelty Engine", description: "Patent novelty analysis", is_enabled: true },
        ]);
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    setFeatures(features.map(f => 
      f.id === id ? { ...f, is_enabled: !f.is_enabled } : f
    ));
    toast({
      title: "Feature Updated",
      description: "Feature status has been successfully updated.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Management</h1>
          <p className="text-muted-foreground mt-2">
            Enable or disable platform features globally.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Feature
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Features</CardTitle>
          <CardDescription>
            These toggles instantly affect the entire platform visibility for all roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell className="font-medium">{feature.feature_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                        {feature.feature_key}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {feature.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={feature.is_enabled}
                          onCheckedChange={() => handleToggle(feature.id)}
                        />
                        <span className={`text-sm font-medium ${feature.is_enabled ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {feature.is_enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Shield className="w-4 h-4" />
                        <span className="sr-only">Permissions</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
