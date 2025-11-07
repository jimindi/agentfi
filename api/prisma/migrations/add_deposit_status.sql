-- Add new status values for hybrid approach
-- Run this migration to update the database

-- The new statuses are:
-- pending_deposit: Waiting for user to deposit tokens to intents.near
-- deposited: User deposited, ready to execute intent
-- waiting_user_execution: Tokens deposited, user must execute intent
-- executing: Intent is being executed by solver
-- completed: Swap completed successfully
-- failed: Swap failed

-- Note: We're using flexible status field, no schema change needed
-- Just documenting the new status values
