import { updateLogEvent } from '../../../middleware/logging';

class DefaultMessage {
  constructor() {
    this.name = 'Unhandled Message';
    this.interactionId = 'Undefined';
  }

  handleMessage() {
    updateLogEvent({
      status: 'Default message',
      parser: { name: this.name, interactionId: this.interactionId }
    });
  }
}

export { DefaultMessage };
