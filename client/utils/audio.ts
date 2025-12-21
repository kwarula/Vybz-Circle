import { Buffer } from "buffer";

/**
 * Adds a WAV header to raw PCM data.
 * @param pcmDataBase64 Base64 encoded PCM data
 * @param sampleRate Sample rate (e.g., 24000)
 * @param numChannels Number of channels (e.g., 1)
 * @param bitDepth Bit depth (e.g., 16)
 * @returns Base64 encoded WAV file
 */
export const pcmToWav = (
    pcmDataBase64: string,
    sampleRate: number = 24000,
    numChannels: number = 1,
    bitDepth: number = 16
): string => {
    const pcmBuffer = Buffer.from(pcmDataBase64, "base64");
    const dataLength = pcmBuffer.length;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const header = Buffer.alloc(headerLength);

    // RIFF chunk descriptor
    header.write("RIFF", 0);
    header.writeUInt32LE(totalLength - 8, 4); // ChunkSize
    header.write("WAVE", 8);

    // fmt sub-chunk
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    header.writeUInt16LE(numChannels, 22); // NumChannels
    header.writeUInt32LE(sampleRate, 24); // SampleRate
    header.writeUInt32LE(sampleRate * numChannels * (bitDepth / 8), 28); // ByteRate
    header.writeUInt16LE(numChannels * (bitDepth / 8), 32); // BlockAlign
    header.writeUInt16LE(bitDepth, 34); // BitsPerSample

    // data sub-chunk
    header.write("data", 36);
    header.writeUInt32LE(dataLength, 40); // Subchunk2Size

    const wavBuffer = Buffer.concat([header, pcmBuffer]);
    return wavBuffer.toString("base64");
};
