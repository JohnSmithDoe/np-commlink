import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import { TaskAnchor } from '../model/task.types';

export const ANCHOR_OPTIONS: readonly { value: TaskAnchor; key: Marker }[] = [
  { value: 'due', key: marker('tasks.anchor.due') },
  { value: 'done', key: marker('tasks.anchor.done') },
];
