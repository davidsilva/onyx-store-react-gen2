import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../amplify/data/resource";
import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Subscription } from "rxjs";
import { ListProduct } from "./";
import { fetchAuthSession } from "aws-amplify/auth";

type Product = Schema["Product"]["type"];

const clientUserPool = generateClient<Schema>({
  authMode: "userPool",
});

const clientIAM = generateClient<Schema>({
  authMode: "iam",
});

const ListProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkIsAdmin = async () => {
      try {
        const session = await fetchAuthSession();
        const tokens = session.tokens;

        let isAdmin = false;

        if (tokens && Object.keys(tokens).length > 0) {
          const groups = tokens.accessToken.payload["cognito:groups"];
          isAdmin = Array.isArray(groups) && groups.includes("Admins");
        }

        setIsAdmin(isAdmin);
      } catch {
        setIsAdmin(false);
      }
    };

    checkIsAdmin();
  }, [authStatus]);

  console.log("ListProducts authStatus", authStatus);

  // const authMode = isSignedIn ? "userPool" : "iam";

  //   const fetchProducts = async () => {
  //     const { data, errors } = await client.models.Product.list();
  //     if (errors) {
  //       console.log(errors);
  //     } else {
  //       console.log(data);
  //       setProducts(data);
  //     }
  //   };

  useEffect(() => {
    console.log("ListProducts useEffect authStatus changed", authStatus);
    let sub: Subscription;
    if (authStatus === "authenticated") {
      sub = clientUserPool.models.Product.observeQuery().subscribe({
        next: ({ items, isSynced }) => {
          console.log("isSynced authenticated", isSynced);
          setProducts(items);
        },
      });
    } else if (authStatus === "unauthenticated") {
      sub = clientIAM.models.Product.observeQuery().subscribe({
        next: ({ items, isSynced }) => {
          console.log("isSynced unauthenticated", isSynced);
          setProducts(items);
        },
      });
    } else {
      return;
    }

    return () => {
      sub.unsubscribe();
    };
  }, [authStatus]);

  return (
    <>
      <h1>List Products</h1>
      <ol>
        {products.map((product) => (
          <ListProduct key={product.id} product={product} isAdmin={isAdmin} />
        ))}
      </ol>
    </>
  );
};

export default ListProducts;
