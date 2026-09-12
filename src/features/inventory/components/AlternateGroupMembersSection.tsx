import { useI18n } from '@/i18n';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Tag, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AlternateGroupMember } from '@/features/inventory/services/partAlternatesService';

type AlternateGroupMembersSectionProps = {
  inventoryMembers: AlternateGroupMember[];
  identifierMembers: AlternateGroupMember[];
  canEdit: boolean;
  isMobile: boolean;
  onAddItem: () => void;
  onAddIdentifier: () => void;
  onRemoveMember: (member: AlternateGroupMember) => void;
};

export function AlternateGroupMembersSection({
  inventoryMembers,
  identifierMembers,
  canEdit,
  isMobile,
  onAddItem,
  onAddIdentifier,
  onRemoveMember,
}: AlternateGroupMembersSectionProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('alternateGroupDetail.inventoryItems')}
              <Badge variant="secondary">{inventoryMembers.length}</Badge>
            </CardTitle>
            <CardDescription>
              {t('alternateGroupDetail.inventoryHelp')}
            </CardDescription>
          </div>
          {canEdit && (
            <Button size="sm" onClick={onAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              {t('alternateGroupDetail.addItem')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {inventoryMembers.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium mb-1">{t('alternateGroupDetail.noInventoryItems')}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('alternateGroupDetail.addInventoryHelp')}
              </p>
              {canEdit && (
                <Button onClick={onAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('alternateGroupDetail.addFirstItem')}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {inventoryMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {member.is_primary && (
                      <Star className="h-4 w-4 text-warning shrink-0" />
                    )}
                    <div className="min-w-0">
                      <button
                        type="button"
                        className="font-medium cursor-pointer hover:text-primary truncate text-left"
                        onClick={() =>
                          navigate(`/dashboard/inventory/${member.inventory_item_id}`)
                        }
                      >
                        {member.inventory_name || t('alternateGroupDetail.unknownItem')}
                      </button>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {member.inventory_sku && <span>SKU: {member.inventory_sku}</span>}
                        <span>{t('alternateGroupDetail.qty', { count: member.quantity_on_hand ?? 0 })}</span>
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isMobile ? 'min-h-11 min-w-11' : undefined}
                      onClick={() => onRemoveMember(member)}
                      aria-label={t('alternateGroupDetail.removeAria', { name: member.inventory_name || t('alternateGroupDetail.inventoryItemFallback') })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {t('alternateGroupDetail.partNumbers')}
              <Badge variant="secondary">{identifierMembers.length}</Badge>
            </CardTitle>
            <CardDescription>
              {t('alternateGroupDetail.partNumbersHelp')}
            </CardDescription>
          </div>
          {canEdit && (
            <Button size="sm" onClick={onAddIdentifier}>
              <Plus className="h-4 w-4 mr-2" />
              {t('alternateGroupDetail.addPartNumber')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {identifierMembers.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-4">
                {t('alternateGroupDetail.noPartNumbers')}
              </p>
              {canEdit && (
                <Button variant="outline" onClick={onAddIdentifier}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('alternateGroupDetail.addFirstPartNumber')}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {identifierMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0">
                      <p className="font-mono font-medium">
                        {member.identifier_value}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {member.identifier_manufacturer && (
                          <span>{member.identifier_manufacturer}</span>
                        )}
                        <Badge variant="outline" className="text-xs uppercase">
                          {member.identifier_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isMobile ? 'min-h-11 min-w-11' : undefined}
                      onClick={() => onRemoveMember(member)}
                      aria-label={t('alternateGroupDetail.removeAria', { name: member.identifier_value || t('alternateGroupDetail.partNumberFallback') })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
