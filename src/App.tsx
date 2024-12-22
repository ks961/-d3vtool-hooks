import { usePersistentState } from "./hooks/usePersistentState/usePersistentState";
import { useReadPersistentState } from "./hooks/usePersistentState/useReadPersistentState";

export default function App() {

    const [ count, setCount ] = usePersistentState("counter", 0);

    function handleInc() {
        setCount(prev => prev + 1);
    }
    
    function handleDec() {
        setCount(prev => prev - 1);
    }

    return(
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginTop: "12rem"
        }}>
            <button onClick={handleDec}>DEC</button>
            <p>{count}</p>
            <button onClick={handleInc}>INC</button>

            <App2 />
        </div>
    );
}

export function App2() {
    const state = useReadPersistentState<number>("counter");
    return(
        <div>
            Read: {state}
        </div>
    );
}