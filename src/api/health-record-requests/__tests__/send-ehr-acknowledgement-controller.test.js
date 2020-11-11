import request from 'supertest';
import { v4 as uuid } from 'uuid';
import app from '../../../app';
import { buildEhrAcknowledgement } from '../../../templates/generate-ehr-acknowledgement';
import { sendMessage } from '../../../services/mhs/mhs-outbound-client';
import { updateLogEvent, updateLogEventWithError } from '../../../middleware/logging';

jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');
jest.mock('../../../templates/generate-ehr-acknowledgement');
jest.mock('../../../services/mhs/mhs-outbound-client');

function expectValidationErrors(nhsNumber, conversationId, messageId, odsCode, errors) {
  return request(app)
    .post(`/health-record-requests/${nhsNumber}/acknowledgement`)
    .send({ conversationId, messageId, odsCode })
    .expect(422)
    .expect(res => {
      expect(res.body).toEqual({
        errors: errors
      });
    });
}

describe('POST /health-record-requests/{conversation-id}/acknowledgement', () => {
  const conversationId = uuid();
  const messageId = uuid();
  const nhsNumber = '1234567890';
  const odsCode = 'B1234';
  const interactionId = 'MCCI_IN010000UK13';
  const acknowledgementMessage = 'fake-acknowledgement-message';

  describe('sendEhrAcknowledgement', () => {
    it('should return a 204 status code', done => {
      request(app)
        .post(`/health-record-requests/${nhsNumber}/acknowledgement`)
        .send({ conversationId, messageId, odsCode })
        .expect(204)
        .expect(() => {
          expect(buildEhrAcknowledgement).toHaveBeenCalledWith(messageId);
        })
        .end(done);
    });

    it('should send acknowledgement to mhs with correct values', done => {
      buildEhrAcknowledgement.mockReturnValue(acknowledgementMessage);
      request(app)
        .post(`/health-record-requests/${nhsNumber}/acknowledgement`)
        .send({ conversationId, messageId, odsCode })
        .expect(() => {
          expect(buildEhrAcknowledgement).toHaveBeenCalledWith(messageId);
          expect(sendMessage).toHaveBeenCalledWith(
            interactionId,
            conversationId,
            odsCode,
            acknowledgementMessage
          );
          expect(updateLogEvent).toHaveBeenCalledWith({ status: 'Acknowledgement sent to MHS' });
        })
        .end(done);
    });

    it('should return a 503 when cannot send acknowledgement to mhs', async done => {
      buildEhrAcknowledgement.mockReturnValue(acknowledgementMessage);
      await sendMessage.mockRejectedValue('cannot send acknowledgement to mhs');
      request(app)
        .post(`/health-record-requests/${nhsNumber}/acknowledgement`)
        .send({ conversationId, messageId, odsCode })
        .expect(503)
        .expect(() => {
          expect(buildEhrAcknowledgement).toHaveBeenCalledWith(messageId);
          expect(sendMessage).toHaveBeenCalledWith(
            interactionId,
            conversationId,
            odsCode,
            acknowledgementMessage
          );
          expect(updateLogEventWithError).toHaveBeenCalled();
        })
        .end(done);
    });
  });

  describe('acknowledgementValidation', () => {
    it('should return a 422 status code when nhsNumber is not 10 digits', done => {
      const invalidNhsNumber = '123';
      expectValidationErrors(invalidNhsNumber, conversationId, messageId, odsCode, [
        { nhsNumber: "'nhsNumber' provided is not 10 digits" }
      ]).end(done);
    });

    it('should return a 422 status code when nhsNumber is not numeric', done => {
      const invalidNhsNumber = 'notNumeric';
      expectValidationErrors(invalidNhsNumber, conversationId, messageId, odsCode, [
        { nhsNumber: "'nhsNumber' provided is not numeric" }
      ]).end(done);
    });

    it('should return a 422 status code when conversationId is not type uuid', done => {
      const invalidConversationId = '123';
      expectValidationErrors(nhsNumber, invalidConversationId, messageId, odsCode, [
        { conversationId: "'conversationId' provided is not of type UUIDv4" }
      ]).end(done);
    });

    it('should return a 422 status code when conversationId is not provided', done => {
      expectValidationErrors(nhsNumber, null, messageId, odsCode, [
        { conversationId: "'conversationId' provided is not of type UUIDv4" },
        { conversationId: "'conversationId' is not configured" }
      ]).end(done);
    });

    it('should return a 422 status code when messageId is not type uuid', done => {
      const invalidMessageId = 'invalid';
      expectValidationErrors(nhsNumber, conversationId, invalidMessageId, odsCode, [
        { messageId: "'messageId' provided is not of type UUIDv4" }
      ]).end(done);
    });

    it('should return a 422 status code when messageId is not provided', done => {
      expectValidationErrors(nhsNumber, conversationId, null, odsCode, [
        { messageId: "'messageId' provided is not of type UUIDv4" },
        { messageId: "'messageId' is not configured" }
      ]).end(done);
    });

    it('should return a 422 status code when odsCode is not provided', done => {
      expectValidationErrors(nhsNumber, conversationId, messageId, null, [
        { odsCode: "'odsCode' is not configured" }
      ]).end(done);
    });
  });
});