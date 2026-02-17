import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Code2, Save, RotateCcw, Rocket, ExternalLink, Info, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  SUPPORTED_FILES,
  loadFileState,
  applyChanges,
  updateContent,
  hasUnsavedChanges,
  resetToBaseline,
  getAppliedTimestamp,
  isApplied,
  type SupportedFile,
} from '../utils/codeEditorStorage';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CodeEditorPanel() {
  const [category, setCategory] = useState<'Backend' | 'Frontend'>('Backend');
  const [selectedFile, setSelectedFile] = useState<string>(SUPPORTED_FILES[0].path);
  const [editorContent, setEditorContent] = useState<string>('');
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [pendingFileSwitch, setPendingFileSwitch] = useState<string | null>(null);
  const [lastAppliedTime, setLastAppliedTime] = useState<number | null>(null);
  const [fileApplied, setFileApplied] = useState<boolean>(false);

  const filesInCategory = SUPPORTED_FILES.filter(f => f.category === category);

  // Load file content when selection changes
  useEffect(() => {
    const state = loadFileState(selectedFile);
    setEditorContent(state.content);
    setLastAppliedTime(getAppliedTimestamp(selectedFile));
    setFileApplied(isApplied(selectedFile));
  }, [selectedFile]);

  const handleCategoryChange = (newCategory: 'Backend' | 'Frontend') => {
    const filesInNewCategory = SUPPORTED_FILES.filter(f => f.category === newCategory);
    const firstFileInCategory = filesInNewCategory[0]?.path;

    if (firstFileInCategory && firstFileInCategory !== selectedFile) {
      if (hasUnsavedChanges(selectedFile)) {
        setPendingFileSwitch(firstFileInCategory);
        setShowSwitchConfirm(true);
      } else {
        setCategory(newCategory);
        setSelectedFile(firstFileInCategory);
      }
    } else {
      setCategory(newCategory);
    }
  };

  const handleFileChange = (newFile: string) => {
    if (newFile !== selectedFile) {
      if (hasUnsavedChanges(selectedFile)) {
        setPendingFileSwitch(newFile);
        setShowSwitchConfirm(true);
      } else {
        setSelectedFile(newFile);
      }
    }
  };

  const confirmFileSwitch = () => {
    if (pendingFileSwitch) {
      const newFile = SUPPORTED_FILES.find(f => f.path === pendingFileSwitch);
      if (newFile) {
        setCategory(newFile.category);
        setSelectedFile(pendingFileSwitch);
      }
      setPendingFileSwitch(null);
    }
    setShowSwitchConfirm(false);
  };

  const cancelFileSwitch = () => {
    setPendingFileSwitch(null);
    setShowSwitchConfirm(false);
  };

  const handleContentChange = (value: string) => {
    setEditorContent(value);
    updateContent(selectedFile, value);
  };

  const handleApplyChanges = () => {
    applyChanges(selectedFile, editorContent);
    setLastAppliedTime(Date.now());
    setFileApplied(true);
  };

  const handleReset = () => {
    const baseline = resetToBaseline(selectedFile);
    setEditorContent(baseline);
  };

  const hasUnsaved = hasUnsavedChanges(selectedFile);
  const currentFile = SUPPORTED_FILES.find(f => f.path === selectedFile);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-1 ring-blue-500/30">
                <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Code Editor
                  <Badge variant="outline" className="text-xs">App Controller Only</Badge>
                </CardTitle>
                <CardDescription>Edit backend and frontend code in your browser</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Browser-Based Editing</AlertTitle>
            <AlertDescription>
              Changes are saved in your browser and persist across sessions. Click "Apply changes" to mark edits as ready for deployment.
            </AlertDescription>
          </Alert>

          {/* Category and File Selection */}
          <div className="space-y-3">
            <Tabs value={category} onValueChange={(v) => handleCategoryChange(v as 'Backend' | 'Frontend')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="Backend">Backend (Motoko)</TabsTrigger>
                <TabsTrigger value="Frontend">Frontend (React/TS)</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select File</label>
              <Select value={selectedFile} onValueChange={handleFileChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filesInCategory.map((file) => (
                    <SelectItem key={file.path} value={file.path}>
                      {file.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Status */}
          <div className="flex items-center gap-2 text-sm">
            {hasUnsaved ? (
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Unsaved changes</span>
              </div>
            ) : fileApplied ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Changes applied</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>No changes applied yet</span>
              </div>
            )}
            {lastAppliedTime && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                <Clock className="h-3.5 w-3.5" />
                <span>Last applied: {format(lastAppliedTime, 'MMM dd, HH:mm:ss')}</span>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Code</label>
            <Textarea
              value={editorContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="font-mono text-sm min-h-[400px] resize-y"
              placeholder="Enter your code here..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleApplyChanges}
              disabled={!hasUnsaved}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Apply changes
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={!hasUnsaved}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Deployment Section */}
          <div className="pt-4 border-t space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Deploy Your Changes
            </h3>
            <Alert variant="default" className="bg-muted/50">
              <AlertDescription className="text-sm space-y-2">
                <p>After applying your changes, deploy them through the Caffeine platform:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground ml-2">
                  <li>Visit the Caffeine platform using the button below</li>
                  <li>Sign in with your Internet Identity</li>
                  <li>Navigate to your app's project dashboard</li>
                  <li>Click "Deploy" to publish your changes</li>
                </ol>
              </AlertDescription>
            </Alert>
            <Button
              asChild
              variant="default"
              className="gap-2"
            >
              <a
                href="https://caffeine.ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Rocket className="h-4 w-4" />
                Deploy via Caffeine
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in <span className="font-mono font-semibold">{currentFile?.label}</span>.
              Switching files will discard these changes. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelFileSwitch}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFileSwitch}>Discard and Switch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
