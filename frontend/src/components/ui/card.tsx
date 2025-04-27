
interface ICardProps {
    color:string
    title:string
    count:number
}

export default function Card (props:ICardProps) {
    return (
        <div
            className={`h-40 rounded-xl flex flex-col items-center justify-center font-semibold ${props.color}`}>
        <div>{props.title}</div>
            <div className="text-2xl font-bold">{props.count}</div>
        </div>
    )
}