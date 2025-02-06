export default function Pagination() {
  return (
    <div className="d-flex justify-content-center mt-3">
      <nav>
        <ul className="pagination">
          <li className="page-item">
            <a className="page-link" href="#">
              «
            </a>
          </li>
          <li className="page-item">
            <a className="page-link active" href="#">
              1
            </a>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">
              2
            </a>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">
              3
            </a>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">
              »
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}
