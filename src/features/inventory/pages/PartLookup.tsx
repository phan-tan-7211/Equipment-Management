import { useI18n } from '@/i18n';
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Factory,
  Tag,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEquipmentManufacturersAndModels } from '@/features/equipment/hooks/useEquipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { 
  getAlternatesForPartNumber, 
  getCompatiblePartsForMakeModel 
} from '@/features/inventory/services/partAlternatesService';
import type { AlternatePartResult, MakeModelCompatiblePart, PartIdentifierType } from '@/features/inventory/types/inventory';
import { groupAlternatePartsByGroupId } from '@/features/inventory/utils/groupAlternateParts';
import { useDebounced } from '@/hooks/useDebounced';
import { PartLookupPartMeta } from '@/features/inventory/components/PartLookupPartMeta';

// Constant for "Any Model" option value
const ANY_MODEL_VALUE = '__any__';

const IDENTIFIER_LABEL_KEY: Record<PartIdentifierType, string> = {
  oem: 'oemType',
  aftermarket: 'aftermarketType',
  sku: 'skuType',
  mpn: 'mpnType',
  upc: 'upcType',
  cross_ref: 'crossRefType',
};

const PartLookup: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  
  // Part number lookup state
  const [partNumber, setPartNumber] = useState('');
  const debouncedPartNumber = useDebounced(partNumber, 300);
  
  // Make/Model lookup state
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const debouncedManufacturer = useDebounced(manufacturer, 300);
  const debouncedModel = useDebounced(model, 300);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'part-number' | 'make-model'>('part-number');
  
  // Get manufacturers/models for dropdown
  const { data: manufacturersData = [] } = useEquipmentManufacturersAndModels(
    currentOrganization?.id
  );
  
  const manufacturers = useMemo(() => 
    manufacturersData.map(m => m.manufacturer),
    [manufacturersData]
  );
  
  const modelsForManufacturer = useMemo(() => {
    const mfr = manufacturersData.find(m => 
      m.manufacturer.toLowerCase() === manufacturer.toLowerCase()
    );
    return mfr?.models || [];
  }, [manufacturersData, manufacturer]);
  
  // Part number alternates query
  // Disable retries for this query since we're searching as user types
  // and failed requests (cancelled, network errors) shouldn't spam the console
  const { 
    data: alternates = [], 
    isLoading: isLoadingAlternates,
    refetch: refetchAlternates
  } = useQuery({
    queryKey: ['part-alternates', currentOrganization?.id, debouncedPartNumber],
    queryFn: ({ signal }) => getAlternatesForPartNumber(
      currentOrganization!.id, 
      debouncedPartNumber,
      signal
    ),
    enabled: !!currentOrganization?.id && debouncedPartNumber.length >= 2,
    retry: false, // Don't retry - user will type more and trigger new query
    staleTime: 30 * 1000, // Cache results for 30 seconds
  });
  
  // Make/Model compatible parts query
  const { 
    data: compatibleParts = [], 
    isLoading: isLoadingCompatible,
    refetch: refetchCompatible
  } = useQuery({
    queryKey: ['make-model-parts', currentOrganization?.id, debouncedManufacturer, debouncedModel],
    queryFn: () => getCompatiblePartsForMakeModel(
      currentOrganization!.id, 
      debouncedManufacturer,
      debouncedModel || undefined
    ),
    enabled: !!currentOrganization?.id && debouncedManufacturer.length >= 2
  });
  
  // Group alternates by group
  const groupedAlternates = useMemo(
    () => groupAlternatePartsByGroupId(alternates),
    [alternates],
  );
  
  const handleViewItem = useCallback((itemId: string) => {
    navigate(`/dashboard/inventory/${itemId}`);
  }, [navigate]);
  
  const handleManufacturerChange = useCallback((value: string) => {
    setManufacturer(value);
    setModel(''); // Reset model when manufacturer changes
  }, []);
  
  if (!currentOrganization) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <PageHeader
          title={t('partLookup.title')}
          description={t('partLookup.selectOrganization')}
        />
      </Page>
    );
  }
  
  return (
    <Page maxWidth="7xl" padding="responsive">
      <div className="space-y-6">
        <PageHeader
          title={t('partLookup.title')}
          description={t('partLookup.description')}
        />
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="part-number" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {t('partLookup.byPartNumber')}
            </TabsTrigger>
            <TabsTrigger value="make-model" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              {t('partLookup.byMakeModel')}
            </TabsTrigger>
          </TabsList>
          
          {/* Part Number Lookup */}
          <TabsContent value="part-number" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('partLookup.lookupNumber')}</CardTitle>
                <CardDescription>
                  {t('partLookup.numberHelp')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder={t('partLookup.numberPlaceholder')}
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                      className="pl-9"
                      aria-label={t('partLookup.numberAria')}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => refetchAlternates()}
                    disabled={isLoadingAlternates}
                    aria-label={t('partLookup.refreshNumber')}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingAlternates ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {partNumber && partNumber.length < 2 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('partLookup.minLength')}
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Empty state guidance */}
            {!partNumber && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('partLookup.guidance')}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['600-311-3620', 'CAT-1R-0750', 'WIX 51773'].map((example) => (
                      <Button
                        key={example}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setPartNumber(example)}
                      >
                        {t('partLookup.tryExample', { example })}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Part Number Results */}
            {isLoadingAlternates ? (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">{t('partLookup.searching')}</span>
                  </div>
                </CardContent>
              </Card>
            ) : debouncedPartNumber.length >= 2 && groupedAlternates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('partLookup.noAlternates')}</h3>
                  <p className="text-muted-foreground">
                    {t('partLookup.noAlternatesHelp', { number: debouncedPartNumber })}
                  </p>
                </CardContent>
              </Card>
            ) : groupedAlternates.length > 0 && (
              <div className="space-y-4">
                {groupedAlternates.map(([groupId, parts]) => (
                  <AlternateGroupCard
                    key={groupId}
                    groupName={parts[0].group_name}
                    groupVerified={parts[0].group_verified}
                    groupNotes={parts[0].group_notes}
                    parts={parts}
                    onViewItem={handleViewItem}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Make/Model Lookup */}
          <TabsContent value="make-model" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('partLookup.lookupMakeModel')}</CardTitle>
                <CardDescription>
                  {t('partLookup.makeModelHelp')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Select value={manufacturer} onValueChange={handleManufacturerChange}>
                      <SelectTrigger aria-label={t('partLookup.selectManufacturerAria')}>
                        <SelectValue placeholder={t('partLookup.selectManufacturer')} />
                      </SelectTrigger>
                      <SelectContent>
                        {manufacturers.map((mfr) => (
                          <SelectItem key={mfr} value={mfr}>
                            {mfr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select 
                      value={model || ANY_MODEL_VALUE} 
                      onValueChange={(v) => setModel(v === ANY_MODEL_VALUE ? '' : v)}
                      disabled={!manufacturer}
                    >
                      <SelectTrigger aria-label={t('partLookup.selectModelAria')}>
                        <SelectValue placeholder={manufacturer ? t('partLookup.selectModel') : t('partLookup.selectManufacturerFirst')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY_MODEL_VALUE}>
                          <span className="italic">{t('partLookup.anyModel')}</span>
                        </SelectItem>
                        {modelsForManufacturer.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => refetchCompatible()}
                    disabled={isLoadingCompatible}
                    aria-label={t('partLookup.refreshMakeModel')}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingCompatible ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {manufacturers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('partLookup.noEquipment')}
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Make/Model Results */}
            {isLoadingCompatible ? (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">{t('partLookup.searching')}</span>
                  </div>
                </CardContent>
              </Card>
            ) : debouncedManufacturer.length >= 2 && compatibleParts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('partLookup.noCompatible')}</h3>
                  <p className="text-muted-foreground">
                    {t('partLookup.noCompatibleHelp', { makeModel: `${debouncedManufacturer}${debouncedModel ? ` ${debouncedModel}` : ''}` })}
                  </p>
                </CardContent>
              </Card>
            ) : compatibleParts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {t('partLookup.compatibleParts')}
                    <Badge variant="secondary">{compatibleParts.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {t('partLookup.compatibleWith', { makeModel: `${manufacturer} ${model || t('partLookup.anyModelHint')}` })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {compatibleParts.map((part) => (
                      <CompatiblePartRow
                        key={part.inventory_item_id}
                        part={part}
                        onViewItem={handleViewItem}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Page>
  );
};

// ============================================
// Sub-components
// ============================================

interface AlternateGroupCardProps {
  groupName: string;
  groupVerified: boolean;
  groupNotes: string | null;
  parts: AlternatePartResult[];
  onViewItem: (itemId: string) => void;
}

const AlternateGroupCard: React.FC<AlternateGroupCardProps> = ({
  groupName,
  groupVerified,
  groupNotes,
  parts,
  onViewItem
}) => {
  const { t } = useI18n();
  const inventoryParts = parts.filter(p => p.inventory_item_id);
  const inStockParts = parts.filter(p => p.is_in_stock);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {groupName}
              {groupVerified && (
                <Badge variant="default" className="bg-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t('partLookup.verified')}
                </Badge>
              )}
            </CardTitle>
            {groupNotes && (
              <CardDescription className="mt-1">{groupNotes}</CardDescription>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>{t('partLookup.inInventory', { count: inventoryParts.length })}</div>
            <div className={inStockParts.length > 0 ? 'text-success font-medium' : ''}>
              {t('partLookup.inStock', { count: inStockParts.length })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {parts.map((part, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                part.is_matching_input 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              } ${part.inventory_item_id ? 'cursor-pointer' : ''}`}
              onClick={() => part.inventory_item_id && onViewItem(part.inventory_item_id)}
              onKeyDown={(e) => {
                if (!part.inventory_item_id) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewItem(part.inventory_item_id);
                }
              }}
              role={part.inventory_item_id ? 'button' : undefined}
              tabIndex={part.inventory_item_id ? 0 : undefined}
              aria-label={part.inventory_item_id ? t('partLookup.openItem', { name: part.inventory_name ?? part.identifier_value ?? '' }) : undefined}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {part.inventory_name ? (
                    <span className="font-medium">{part.inventory_name}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {part.identifier_manufacturer && `${part.identifier_manufacturer} `}
                      {part.identifier_value}
                    </span>
                  )}
                  
                  {part.is_matching_input && (
                    <Badge variant="outline" className="text-xs">
                      {t('partLookup.searched')}
                    </Badge>
                  )}
                  
                  {part.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      {t('partLookup.primary')}
                    </Badge>
                  )}
                  
                  {part.identifier_type && (
                    <Badge variant="outline" className="text-xs uppercase">
                      {t(`partLookup.${IDENTIFIER_LABEL_KEY[part.identifier_type]}`)}
                    </Badge>
                  )}
                </div>
                
                {part.inventory_item_id && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    {part.inventory_sku && (
                      <span>SKU: {part.inventory_sku}</span>
                    )}
                    <PartLookupPartMeta
                      location={part.location}
                      defaultUnitCost={part.default_unit_cost}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 ml-4">
                {part.inventory_item_id && (
                  <>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        part.is_low_stock 
                          ? 'text-destructive' 
                          : part.is_in_stock 
                            ? 'text-success' 
                            : 'text-muted-foreground'
                      }`}>
                        {t('partLookup.inStock', { count: part.quantity_on_hand })}
                      </div>
                      {part.is_low_stock && (
                        <div className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {t('partLookup.lowStock')}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface CompatiblePartRowProps {
  part: MakeModelCompatiblePart;
  onViewItem: (itemId: string) => void;
}

const CompatiblePartRow: React.FC<CompatiblePartRowProps> = ({ part, onViewItem }) => {
  const { t } = useI18n();
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
      onClick={() => onViewItem(part.inventory_item_id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewItem(part.inventory_item_id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t('partLookup.openItem', { name: part.name })}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{part.name}</span>
          
          {part.is_verified && (
            <Badge variant="default" className="bg-success text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {t('partLookup.verified')}
            </Badge>
          )}
          
          <Badge variant="outline" className="text-xs capitalize">
            {t(`partLookup.${({ any: 'matchAny', exact: 'matchExact', prefix: 'matchPrefix', wildcard: 'matchWildcard' } as const)[part.rule_match_type] ?? 'matchExact'}`)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
          {part.sku && (
            <span>SKU: {part.sku}</span>
          )}
          <PartLookupPartMeta location={part.location} defaultUnitCost={part.default_unit_cost} />
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <div className="text-right">
          <div className={`font-semibold ${
            part.quantity_on_hand <= part.low_stock_threshold 
              ? 'text-destructive' 
              : part.is_in_stock 
                ? 'text-success' 
                : 'text-muted-foreground'
          }`}>
            {t('partLookup.inStock', { count: part.quantity_on_hand })}
          </div>
          {part.quantity_on_hand <= part.low_stock_threshold && (
            <div className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t('partLookup.lowStock')}
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default PartLookup;

