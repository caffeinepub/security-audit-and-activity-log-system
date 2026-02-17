import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download, Upload, RotateCcw, CheckCircle2, AlertCircle, Network, Settings, Zap, Shield, Activity, Flag, Beaker, Wrench } from 'lucide-react';
import { CATEGORIES, CONTROLS } from '../icp-controls/registry';
import { useIcpControls } from '../hooks/useIcpControls';
import { downloadConfiguration, readConfigurationFile } from '../utils/icpControlsImportExport';
import IcpControlsCatalogRow from './IcpControlsCatalogRow';
import { toast } from 'sonner';

const CATEGORY_ICONS = {
  network: Network,
  agent: Settings,
  performance: Zap,
  security: Shield,
  diagnostics: Activity,
  features: Flag,
  experimental: Beaker,
  advanced: Wrench,
};

export default function IcpControlsCatalog() {
  const { config, setControlValue, resetToDefaults, hasOverrides, getEffectiveSnapshot, applyImportedConfig } = useIcpControls();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter controls by search query
  const filteredControls = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) {
      return CONTROLS.filter(c => c.category === activeCategory);
    }
    
    return CONTROLS.filter(control => {
      const matchesCategory = control.category === activeCategory;
      const matchesSearch = 
        control.title.toLowerCase().includes(query) ||
        control.description?.toLowerCase().includes(query) ||
        control.keywords.some(k => k.toLowerCase().includes(query));
      
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);
  
  const handleControlChange = (controlId: string, value: any) => {
    try {
      setControlValue(controlId, value);
      setSuccessMessage(`${controlId} updated successfully`);
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error: any) {
      setErrorMessage(error.message);
      setSuccessMessage(null);
    }
  };
  
  const handleReset = () => {
    resetToDefaults();
    setSuccessMessage('All settings reset to defaults');
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  const handleExport = () => {
    try {
      const snapshot = getEffectiveSnapshot();
      downloadConfiguration(snapshot);
      toast.success('Configuration exported successfully');
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    }
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const { config: importedConfig, errors } = await readConfigurationFile(file);
      
      if (errors.length > 0) {
        setErrorMessage(`Import failed:\n${errors.join('\n')}`);
        setSuccessMessage(null);
        toast.error('Import failed - see error details');
        return;
      }
      
      applyImportedConfig(importedConfig);
      setSuccessMessage('Configuration imported successfully');
      setErrorMessage(null);
      toast.success('Configuration imported and applied');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(`Import failed: ${error.message}`);
      setSuccessMessage(null);
      toast.error('Import failed');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const CategoryIcon = CATEGORY_ICONS[activeCategory] || Settings;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              ICP Controls Catalog
            </CardTitle>
            <CardDescription>
              Configure {CONTROLS.length}+ operational settings for Internet Computer connections
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleImportClick} variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            {hasOverrides && (
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {successMessage && (
          <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-wrap">{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search controls by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={activeCategory} onValueChange={(val) => setActiveCategory(val as any)}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {CATEGORIES.map(category => {
              const Icon = CATEGORY_ICONS[category.id];
              return (
                <TabsTrigger key={category.id} value={category.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {CATEGORIES.map(category => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <CategoryIcon className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <h3 className="font-semibold">{category.label}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              
              <ScrollArea className="h-[500px] rounded-md border p-4">
                {filteredControls.length > 0 ? (
                  <div className="space-y-0">
                    {filteredControls.map(control => (
                      <IcpControlsCatalogRow
                        key={control.id}
                        control={control}
                        value={config[control.id]}
                        onChange={(value) => handleControlChange(control.id, value)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No controls found matching "{searchQuery}"
                  </div>
                )}
              </ScrollArea>
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredControls.length} of {CONTROLS.filter(c => c.category === category.id).length} controls in this category
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
