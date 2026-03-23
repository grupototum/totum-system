import { useState } from "react";
import { useImportData, SYSTEM_FIELDS, type ValidatedRow, parseValue } from "@/hooks/useImportData";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Download, AlertTriangle, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DataImport() {
  const {
    step, setStep, file, parseFile, detectedColumns,
    mapping, updateMapping, validatedRows, validate,
    importing, progress, executeImport, rollbackLastImport,
    downloadTemplate, stats,
  } = useImportData();

  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmRollback, setConfirmRollback] = useState(false);

  const steps = [
    { num: 1, label: "Upload" },
    { num: 2, label: "Mapeamento" },
    { num: 3, label: "Validação e Importação" },
  ];

  const requiredMapped = SYSTEM_FIELDS.filter(f => f.required).every(f =>
    Object.values(mapping).includes(f.key)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Importação de Dados</h1>
          <p className="text-sm text-muted-foreground">Importe dados via planilha CSV ou Excel</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfirmRollback(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Desfazer Última Importação
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              step === s.num ? "bg-primary text-primary-foreground" :
              step > s.num ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">{s.num}</span>
              {s.label}
            </div>
            {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 1 && <UploadStep file={file} parseFile={parseFile} downloadTemplate={downloadTemplate} onNext={() => setStep(2)} />}
      {step === 2 && (
        <MappingStep
          detectedColumns={detectedColumns}
          mapping={mapping}
          updateMapping={updateMapping}
          requiredMapped={requiredMapped}
          onBack={() => setStep(1)}
          onNext={() => { validate(); setStep(3); }}
        />
      )}
      {step === 3 && (
        <ValidationStep
          validatedRows={validatedRows}
          stats={stats}
          importing={importing}
          progress={progress}
          onBack={() => setStep(2)}
          onImport={() => setConfirmImport(true)}
        />
      )}

      <Dialog open={confirmImport} onOpenChange={setConfirmImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Importação</DialogTitle>
            <DialogDescription>
              Você está prestes a importar <strong>{stats.valid}</strong> registros. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmImport(false)}>Cancelar</Button>
            <Button onClick={() => { setConfirmImport(false); executeImport(); }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRollback} onOpenChange={setConfirmRollback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desfazer Última Importação</DialogTitle>
            <DialogDescription>
              Isso removerá todos os registros da última importação. Essa ação não pode ser revertida. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRollback(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { setConfirmRollback(false); rollbackLastImport(); }}>
              Remover Registros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Upload Step ─── */
function UploadStep({ file, parseFile, downloadTemplate, onNext }: {
  file: File | null;
  parseFile: (f: File) => Promise<void>;
  downloadTemplate: () => void;
  onNext: () => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    onDrop: (files) => { if (files[0]) parseFile(files[0]); },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Template de Exemplo</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" /> Download Planilha Exemplo (.csv)
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Template universal com campos para dados financeiros, clientes e contatos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            {file ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">Arraste outro arquivo para substituir</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Arraste um arquivo ou clique para selecionar</p>
                <p className="text-sm text-muted-foreground mt-1">Formatos: .csv, .xls, .xlsx</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!file}>
          Próximo <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Mapping Step ─── */
function MappingStep({ detectedColumns, mapping, updateMapping, requiredMapped, onBack, onNext }: {
  detectedColumns: string[];
  mapping: Record<string, string>;
  updateMapping: (col: string, field: string) => void;
  requiredMapped: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Mapeamento de Colunas</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {detectedColumns.map(col => (
              <div key={col} className="flex items-center gap-4">
                <div className="w-1/3 text-sm font-medium truncate" title={col}>{col}</div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="w-1/2">
                  <Select value={mapping[col] || "__ignore__"} onValueChange={(v) => updateMapping(col, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ignore__">Ignorar coluna</SelectItem>
                      {SYSTEM_FIELDS.map(f => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label} {f.required ? "⚠️" : "(Opcional)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {mapping[col] && SYSTEM_FIELDS.find(f => f.key === mapping[col])?.required && (
                  <Badge className="text-xs shrink-0">Obrigatório</Badge>
                )}
              </div>
            ))}
          </div>
          {!requiredMapped && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Mapeie todos os campos obrigatórios: Data, Descrição, Valor, Tipo
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
        <Button onClick={onNext} disabled={!requiredMapped}>Validar <ArrowRight className="h-4 w-4 ml-2" /></Button>
      </div>
    </div>
  );
}

/* ─── Validation Step ─── */
function ValidationStep({ validatedRows, stats, importing, progress, onBack, onImport }: {
  validatedRows: ValidatedRow[];
  stats: { total: number; valid: number; invalid: number; totalIncome: number; totalExpense: number };
  importing: boolean;
  progress: number;
  onBack: () => void;
  onImport: () => void;
}) {
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Registros Válidos</p>
          <p className="text-2xl font-bold text-primary">{stats.valid}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Receitas</p>
          <p className="text-2xl font-bold text-emerald-500">{fmt(stats.totalIncome)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Despesas</p>
          <p className="text-2xl font-bold text-rose-500">{fmt(stats.totalExpense)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Saldo Final</p>
          <p className="text-2xl font-bold">{fmt(stats.totalIncome - stats.totalExpense)}</p>
        </CardContent></Card>
      </div>

      {stats.invalid > 0 && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          {stats.invalid} registro(s) com erros. Corrija a planilha e reimporte.
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Pré-visualização ({Math.min(validatedRows.length, 20)} de {validatedRows.length})</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validatedRows.slice(0, 20).map((row, i) => (
                  <TableRow key={i} className={row.isValid ? "" : "bg-destructive/5"}>
                    <TableCell>
                      {row.isValid
                        ? <CheckCircle2 className="h-4 w-4 text-primary" />
                        : <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </TableCell>
                    <TableCell>{row.data.date || <EmptyCell />}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{row.data.description || <EmptyCell />}</TableCell>
                    <TableCell>{row.data.value || <EmptyCell />}</TableCell>
                    <TableCell>{row.data.type || <EmptyCell />}</TableCell>
                    <TableCell>{row.data.client_name || <EmptyCell />}</TableCell>
                    <TableCell>
                      {row.errors.length > 0 && <span className="text-xs text-destructive">{row.errors.join(", ")}</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {importing && (
        <Card><CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Importando...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent></Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={importing}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
        <Button onClick={onImport} disabled={importing || stats.invalid > 0 || stats.valid === 0}>
          Importar {stats.valid} Registros
        </Button>
      </div>
    </div>
  );
}

function EmptyCell() {
  return <span className="text-muted-foreground italic text-xs">Não informado</span>;
}
