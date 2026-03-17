import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "color" | "number";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface RegistryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
}

export function RegistryFormDialog({
  open,
  onOpenChange,
  title,
  fields,
  initialValues,
  onSubmit,
}: RegistryFormDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      setValues(initialValues || {});
    }
  }, [open, initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
    onOpenChange(false);
  };

  const updateValue = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e1516] border-white/[0.1] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-sm text-white/70">{field.label}</Label>
              {field.type === "text" || field.type === "number" ? (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  placeholder={field.placeholder}
                  value={values[field.key] || ""}
                  onChange={(e) => updateValue(field.key, e.target.value)}
                  required={field.required}
                  className="bg-white/[0.05] border-white/[0.1] rounded-xl h-10 text-sm placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20"
                />
              ) : field.type === "textarea" ? (
                <Textarea
                  placeholder={field.placeholder}
                  value={values[field.key] || ""}
                  onChange={(e) => updateValue(field.key, e.target.value)}
                  className="bg-white/[0.05] border-white/[0.1] rounded-xl text-sm placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 min-h-[80px] resize-none"
                />
              ) : field.type === "color" ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={values[field.key] || "#ff3b3b"}
                    onChange={(e) => updateValue(field.key, e.target.value)}
                    className="h-10 w-10 rounded-lg border border-white/[0.1] bg-transparent cursor-pointer"
                  />
                  <Input
                    value={values[field.key] || "#ff3b3b"}
                    onChange={(e) => updateValue(field.key, e.target.value)}
                    className="bg-white/[0.05] border-white/[0.1] rounded-xl h-10 text-sm font-mono placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
              ) : field.type === "select" ? (
                <Select
                  value={values[field.key] || ""}
                  onValueChange={(v) => updateValue(field.key, v)}
                >
                  <SelectTrigger className="bg-white/[0.05] border-white/[0.1] rounded-xl h-10 text-sm focus:border-primary/50 focus:ring-primary/20">
                    <SelectValue placeholder={field.placeholder || "Selecione"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#271c1d] border-white/[0.1] text-white">
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/[0.06] focus:text-white">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          ))}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/60 hover:text-white hover:bg-white/[0.06]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gradient-primary border-0 text-white font-semibold rounded-full px-6"
            >
              {initialValues?.id ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
