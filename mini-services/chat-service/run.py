import subprocess
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

while True:
    try:
        proc = subprocess.Popen(
            [sys.executable.replace("python", "bun"), "index.ts"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        for line in proc.stdout:
            sys.stdout.buffer.write(line)
            sys.stdout.buffer.flush()
        proc.wait()
        print(f"Process exited with code {proc.returncode}, restarting...", flush=True)
    except Exception as e:
        print(f"Error: {e}, restarting...", flush=True)
