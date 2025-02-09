import Link from 'next/link'

const Home = () => {
  return (
    <div>
    <div>Hello welcome to Quoticon</div>
    <Link href="/manage">
        <button>visit the manage page</button>
      </Link>
    </div>
  )
}

export default Home