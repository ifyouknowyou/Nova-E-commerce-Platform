export type WorkflowExecutionStatus = 'SUCCESS' | 'FAILED';
export type WorkflowTriggerType =
  | 'DEAL_WON'
  | 'INVENTORY_LOW'
  | 'STATUS_CHANGED'
  | 'RECORD_CREATED'
  | 'SCHEDULED';