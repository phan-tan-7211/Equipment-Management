import { Calendar, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PersistedViewMode } from '@/features/work-orders/calendar/url';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
export type WorkOrdersViewToggleProps={surface:PersistedViewMode;onChange:(surface:PersistedViewMode)=>void;className?:string;};
export function WorkOrdersViewToggle({surface,onChange,className}:WorkOrdersViewToggleProps){const{t}=useI18n();return <div className={cn('hidden md:flex items-center rounded-md border',className)} role="radiogroup" aria-label={t('workOrders.list.viewAria')}><Button variant="ghost" size="icon" className={cn('h-8 w-8 rounded-r-none',surface==='list'&&'bg-muted')} onClick={()=>onChange('list')} aria-label={t('workOrders.list.listView')} aria-checked={surface==='list'} role="radio"><List className="h-3.5 w-3.5"/></Button><Button variant="ghost" size="icon" className={cn('h-8 w-8 rounded-l-none',surface==='calendar'&&'bg-muted')} onClick={()=>onChange('calendar')} aria-label={t('workOrders.list.calendarView')} aria-checked={surface==='calendar'} role="radio"><Calendar className="h-3.5 w-3.5"/></Button></div>;}
