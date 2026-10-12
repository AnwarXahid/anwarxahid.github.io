"""One outbound consumer. No inbound port or tunnel; no content written to disk."""
import asyncio
import random
import re
import httpx
from config import Settings
from service import Generation, available, generate_questions

async def main():
    settings = Settings()
    if not re.fullmatch(r'[a-f0-9]{64}', settings.agent_secret):
        raise SystemExit('Set AGENT_SECRET to the provisioned 64-character hex secret.')
    delay = 60
    async with httpx.AsyncClient(timeout=30, headers={'Authorization':f'Bearer {settings.agent_secret}'}) as client:
        async def send(path, payload):
            response = await client.post(settings.worker_url + path, json=payload)
            response.raise_for_status()
            return response.json()

        async def renew(job):
            while True:
                await asyncio.sleep(60)
                await send(f"/agent/jobs/{job['id']}/renew", {'lease':job['lease']})

        while True:
            try:
                result = await send('/agent/claim', {'available':await available()})
                job = result.get('job')
                if not job:
                    delay = 60
                else:
                    heartbeat = asyncio.create_task(renew(job))
                    inference = asyncio.create_task(generate_questions(Generation.model_validate(job['input'])))
                    payload = {'lease':job['lease']}
                    try:
                        done, _ = await asyncio.wait([heartbeat,inference], return_when=asyncio.FIRST_COMPLETED, timeout=settings.generation_timeout*2+10)
                        if heartbeat in done or not inference.done():
                            inference.cancel()
                            raise RuntimeError('expiredLease')
                        payload['questions'] = inference.result()
                    except Exception as error:
                        code = getattr(error, 'detail', '')
                        payload['error'] = code if code in ('modelUnavailable','invalidGeneration','generationFailed') else 'generationFailed'
                    finally:
                        heartbeat.cancel()
                        inference.cancel()
                        await asyncio.gather(heartbeat,inference, return_exceptions=True)
                    # Retry the same completion only; Worker treats repeated completion idempotently.
                    for retry in range(3):
                        try:
                            await send(f"/agent/jobs/{job['id']}/complete", payload)
                            break
                        except httpx.HTTPError:
                            if retry == 2:
                                raise
                            await asyncio.sleep(2**retry)
                    delay = 60
            except (httpx.HTTPError, ValueError, RuntimeError):
                delay = min(600, delay * 2)
                print('Agent connection unavailable; retrying with backoff.', flush=True)
            await asyncio.sleep(delay + random.uniform(0, 10))

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
