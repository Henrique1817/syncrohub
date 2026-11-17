import { Lightbulb, Megaphone } from 'lucide-react';
import { firstName } from '../../lib/utils';
import type { Task } from '../../types';
import { Badge } from '../ui/Badge';

/** Destaca tasks que vieram de um gestor. Em tasks de ideia, `createdBy` é o autor da ideia. */
export function SourceBadge({ task }: { task: Pick<Task, 'source' | 'createdByName'> }) {
  if (task.source === 'ENGINEER') return null;

  if (task.source === 'IDEA') {
    return (
      <Badge tone="amber" icon={Lightbulb}>
        Ideia de {firstName(task.createdByName)}
      </Badge>
    );
  }
  return (
    <Badge tone="violet" icon={Megaphone}>
      Solicitado por {firstName(task.createdByName)}
    </Badge>
  );
}
