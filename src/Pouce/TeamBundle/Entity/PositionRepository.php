<?php

namespace Pouce\TeamBundle\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * PositionRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class PositionRepository extends EntityRepository
{

    public function findLastPosition($teamId)
    {
        $qb = $this -> createQueryBuilder('p')
                    -> leftJoin('p.city','c')
                    -> addSelect('c')
                    -> leftJoin('c.country','co')
                    -> addSelect('co')
                    -> Join('p.team','t')
                    -> where('t.id = :teamId')
                     -> setParameter('teamId', $teamId)
                    -> orderBy('p.created','DESC')
                    -> setMaxResults(1)
                     ;

        return $qb->getQuery();
    }

    public function findAllPositionsByTeamAndEdition($teamId, $editionId)
    {
        $qb = $this -> createQueryBuilder('p')
                    -> Join('p.city','c')
                    -> addSelect('c')
                    -> Join('c.country','co')
                    -> addSelect('co')
                    -> Join('p.team','t')
                    -> Join('t.edition','e')
                    -> where('t.id = :teamId')
                     -> setParameter('teamId', $teamId)
                    -> andWhere('e.id = :editionId')
                     -> setParameter('editionId', $editionId)
                    -> orderBy('p.created','ASC')
                     ;

        return $qb->getQuery()->getResult();;
    }
}
